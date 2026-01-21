import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * E2E Tests for User Management Module
 *
 * Test Flow Description:
 * 1. User Registration - Create test users for authentication
 * 2. User Login - Authenticate to get access tokens
 * 3. User Profile Management - Get, Update user profiles
 * 4. File Upload - Test avatar upload functionality
 * 5. Permission Validation - Ensure users can only modify their own data
 *
 * Edge Cases Tested:
 * - Unauthorized access attempts
 * - Permission violations (user trying to modify other users)
 * - Invalid data validation
 * - File upload constraints
 * - Biography JSON parsing
 * - Missing required fields
 */

describe('User Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUsers: any[] = [];

  // Helper functions for authentication
  const createTestUser = async (userData: any) => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    const user = {
      id: response.body.data.user.id,
      email: userData.email,
      accessToken: response.body.data.tokens.accessToken,
      refreshToken: response.body.data.tokens.refreshToken,
      fullName: userData.fullName,
    };

    testUsers.push(user);
    return user;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        // Nếu bật forbidNonWhitelisted: true, hãy chắc chắn bạn không gửi thừa field nào từ test
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((user) => user.email),
        },
      },
    });
    await app.close();
  });

  describe('1. AUTHENTICATION FLOW', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'auth.test@example.com',
        password: 'password123',
        fullName: 'Auth Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.userProfile.fullName).toBe(
        userData.fullName,
      );
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });

    it('should login user successfully', async () => {
      // First register a user
      const userData = {
        email: 'login.test@example.com',
        password: 'password123',
        fullName: 'Login Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Then login
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send(loginData)
        .expect(404);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate.test@example.com',
        password: 'password123',
        fullName: 'Duplicate Test User',
      };

      // Register first time
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409);

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });
  });

  describe('2. USER PROFILE MANAGEMENT', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: 'profile.test@example.com',
        password: 'password123',
        fullName: 'Profile Test User',
      });
    });

    it('should get user by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.userProfile).toBeDefined();
      expect(response.body.data.userProfile.fullName).toBe(testUser.fullName);
    });

    it('should update user full name successfully', async () => {
      const updateData = {
        fullName: 'Updated Test User',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile.fullName).toBe(updateData.fullName);
    });

    it('should update user email successfully', async () => {
      const newEmail = 'updated1.email@example.com';
      const updateData = {
        email: newEmail,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newEmail);
    });

    it('should update user password successfully', async () => {
      const updateData = {
        password: 'newPassword123',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify login with new password works
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          // email: testUser.email,
          email: 'updated1.email@example.com',
          password: 'newPassword123',
        })
        .expect(200);
    });

    it('should update user date of birth successfully', async () => {
      const updateData = {
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      const receivedDate =
        response.body.data.userProfile.dateOfBirth.split('T')[0];

      expect(receivedDate).toBe(updateData.dateOfBirth);
    });

    it('should update user biography as JSON string successfully', async () => {
      const biography = JSON.stringify({
        about: 'Software developer passionate about testing',
        interests: ['coding', 'testing', 'quality assurance'],
        experience: '5 years',
      });

      const updateData = {
        biography: biography,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile.biography).toBeDefined();
    });

    it('should update multiple fields simultaneously', async () => {
      const updateData = {
        fullName: 'Multi Updated User',
        dateOfBirth: '1985-05-15',
        biography: JSON.stringify({
          role: 'Senior QA Engineer',
          skills: ['E2E Testing', 'NestJS', 'Prisma'],
        }),
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile.fullName).toBe(updateData.fullName);
      expect(response.body.data.userProfile.dateOfBirth.split('T')[0]).toBe(
        updateData.dateOfBirth,
      );
      expect(response.body.data.userProfile.biography).toBeDefined();
    });
  });

  describe('3. VALIDATION CASES', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: 'validation.test@example.com',
        password: 'password123',
        fullName: 'Validation Test User',
      });
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email-format',
        password: 'password123',
        fullName: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'short.pass@example.com',
        password: '123', // Less than 6 characters
        fullName: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with empty name', async () => {
      const userData = {
        email: 'empty.name@example.com',
        password: 'password123',
        fullName: '',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject update with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email-format',
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject update with invalid biography JSON', async () => {
      const updateData = {
        biography: 'invalid json string {',
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject update with invalid date format', async () => {
      const updateData = {
        dateOfBirth: 'invalid-date',
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('4. AUTHORIZATION CASES', () => {
    describe('4.1 Unauthorized Access (401)', () => {
      it('should reject get user without authentication', async () => {
        await request(app.getHttpServer())
          .get('/users/some-user-id')
          .expect(401);
      });

      it('should reject update user without authentication', async () => {
        await request(app.getHttpServer())
          .patch('/users/some-user-id')
          .send({ fullName: 'Updated Name' })
          .expect(401);
      });

      it('should reject login without credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login-base')
          .send({})
          .expect(400);
      });
    });

    describe('4.2 Permission Violations (403)', () => {
      let user1: any;
      let user2: any;

      beforeAll(async () => {
        user1 = await createTestUser({
          email: 'permission.user1@example.com',
          password: 'password123',
          fullName: 'Permission User 1',
        });

        user2 = await createTestUser({
          email: 'permission.user2@example.com',
          password: 'password123',
          fullName: 'Permission User 2',
        });
      });

      it('should reject user trying to update another user', async () => {
        const updateData = {
          fullName: 'Hacked Name',
        };

        await request(app.getHttpServer())
          .patch(`/users/${user2.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .send(updateData)
          .expect(403);
      });

      it('should reject user trying to get another user', async () => {
        await request(app.getHttpServer())
          .get(`/users/${user2.id}`)
          .set('Authorization', `Bearer ${user1.accessToken}`)
          .expect(404);
      });
    });
  });

  describe('5. FILE UPLOAD TESTS', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: 'upload.test@example.com',
        password: 'password123',
        fullName: 'Upload Test User',
      });
    });

    it('should upload avatar successfully with valid image', async () => {
      // Create a small JPEG buffer (minimal valid JPEG)
      const jpegBuffer = readFileSync(join(__dirname, '1099451.jpg'));

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('avatar', jpegBuffer, 'avatar.jpg');

      // In lỗi nếu không phải 200
      if (response.status !== 200) {
        console.log('--- CHI TIẾT LỖI 400 ---');
        console.dir(response.body, { depth: null });
        console.log('------------------------');
      }

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile.avatar).toBeDefined();
      expect(typeof response.body.data.userProfile.avatar).toBe('string');
    });

    it('should reject upload with invalid file type', async () => {
      const invalidFile = Buffer.from('fake text content');

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('avatar', invalidFile, 'test.txt')
        .expect(400);
    });

    it('should reject upload with oversized file', async () => {
      // Create a large buffer (assuming max size is 2MB, we'll use 3MB)
      const largeFile = Buffer.alloc(3 * 1024 * 1024, 'x');

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('avatar', largeFile, 'large.jpg')
        .expect(400);
    });

    it('should handle avatar upload with empty request body', async () => {
      const jpegBuffer = readFileSync(join(__dirname, '1099451.jpg'));

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('avatar', jpegBuffer, 'avatar2.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle update without file (file is optional)', async () => {
      const updateData = {
        fullName: 'Updated without file',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('6. DATABASE / BUSINESS LOGIC CASES', () => {
    it('should return 404 for non-existent user', async () => {
      const testUser = await createTestUser({
        email: 'notfound.test@example.com',
        password: 'password123',
        fullName: 'Not Found Test User',
      });

      await request(app.getHttpServer())
        .get('/users/non-existent-user-id')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(404);
    });

    it('should handle user update with no changes', async () => {
      const testUser = await createTestUser({
        email: 'nochange.test@example.com',
        password: 'password123',
        fullName: 'No Change Test User',
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle biography as complex nested JSON', async () => {
      const testUser = await createTestUser({
        email: 'complex.bio@example.com',
        password: 'password123',
        fullName: 'Complex Biography User',
      });

      const complexBiography = {
        personal: {
          age: 30,
          location: 'Test City',
          occupation: 'QA Engineer',
        },
        skills: [
          { name: 'E2E Testing', level: 'Expert' },
          { name: 'NestJS', level: 'Advanced' },
          { name: 'Prisma', level: 'Intermediate' },
        ],
        experience: {
          years: 5,
          companies: ['Company A', 'Company B'],
          projects: 25,
        },
      };

      const updateData = {
        biography: JSON.stringify(complexBiography),
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile.biography).toBeDefined();
    });
  });

  describe('7. INTEGRATION TESTS', () => {
    it('should complete full user management flow: Register -> Login -> Update Profile -> Verify Changes', async () => {
      // Step 1: Register new user
      const userData = {
        email: 'integration.user@example.com',
        password: 'password123',
        fullName: 'Integration Test User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const id = registerResponse.body.data.user.id;
      const accessToken = registerResponse.body.data.tokens.accessToken;

      // Step 2: Login to verify credentials work
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.data.user.id).toBe(id);

      // Step 3: Get initial user data
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.email).toBe(userData.email);
      expect(getResponse.body.data.userProfile.fullName).toBe(
        userData.fullName,
      );

      // Step 4: Update user profile with multiple fields
      const updateData = {
        fullName: 'Updated Integration User',
        dateOfBirth: '1992-03-15',
        biography: JSON.stringify({
          role: 'Senior QA Automation Engineer',
          specialties: ['E2E Testing', 'API Testing', 'Performance Testing'],
          certification: 'ISTQB Certified Tester',
        }),
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      console.log('676:', updateResponse.body);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.userProfile.fullName).toBe(
        updateData.fullName,
      );
      expect(
        updateResponse.body.data.userProfile.dateOfBirth.split('T')[0],
      ).toBe(updateData.dateOfBirth);

      // Step 5: Upload avatar
      const jpegBuffer = readFileSync(join(__dirname, '1099451.jpg'));

      const avatarResponse = await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', jpegBuffer, 'integration-avatar.jpg')
        .expect(200);

      expect(avatarResponse.body.success).toBe(true);
      expect(avatarResponse.body.data.userProfile.avatar).toBeDefined();

      // Step 6: Verify final user state
      const finalResponse = await request(app.getHttpServer())
        .get(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalResponse.body.data.userProfile.fullName).toBe(
        updateData.fullName,
      );
      expect(
        finalResponse.body.data.userProfile.dateOfBirth.split('T')[0],
      ).toBe(updateData.dateOfBirth);
      expect(finalResponse.body.data.userProfile.biography).toBeDefined();
      expect(finalResponse.body.data.userProfile.avatar).toBeDefined();

      // Step 7: Verify login still works after updates
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });

    it('should handle password change flow: Update -> Login with new password -> Verify old password fails', async () => {
      // Step 1: Register user
      const userData = {
        email: 'password.flow@example.com',
        password: 'originalPassword123',
        fullName: 'Password Flow User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const id = registerResponse.body.data.user.id;
      const accessToken = registerResponse.body.data.tokens.accessToken;

      // Step 2: Update password
      const newPassword = 'newPassword456';
      const updateData = {
        password: newPassword,
      };

      await request(app.getHttpServer())
        .patch(`/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Step 3: Verify login with new password works
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: userData.email,
          password: newPassword,
        })
        .expect(200);

      // Step 4: Verify login with old password fails
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(401);

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });
  });
});
