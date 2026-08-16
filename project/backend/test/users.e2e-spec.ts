import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisteredUser,
  createTestUser as createRegisteredUser,
} from './helpers/auth.helpers';
import { AuthResponse } from 'src/modules/auth/types/auth-response.type';
import { UserResponse } from 'src/modules/users/types/user-response.type';

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
  let api: TestApi;
  const testUsers: { email: string }[] = [];

  // Helper functions for authentication
  const createTestUser = async (userData: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<RegisteredUser> => {
    const user = await createRegisteredUser(api, userData);
    testUsers.push({ email: userData.email });
    return user;
  };

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      httpServer,
    } = await createTestApp({
      globalPrefix: false,
      validationPipe: {
        transform: true,
        whitelist: true,
        // Nếu bật forbidNonWhitelisted: true, hãy chắc chắn bạn không gửi thừa field nào từ test
      },
    });

    app = testApp;
    prisma = testPrisma;
    api = new TestApi(httpServer);
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

      const body = await api.post<AuthResponse>('/auth/register', userData, {
        expect: 201,
      });

      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(userData.email);
      expect(body.data.user.userProfile.fullName).toBe(userData.fullName);
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();

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

      await api.post<AuthResponse>('/auth/register', userData, {
        expect: 201,
      });

      // Then login
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const body = await api.post<AuthResponse>('/auth/login-base', loginData, {
        expect: 200,
      });

      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(userData.email);
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      await api.post('/auth/login-base', loginData, { expect: 404 });
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate.test@example.com',
        password: 'password123',
        fullName: 'Duplicate Test User',
      };

      // Register first time
      await api.post('/auth/register', userData, { expect: 201 });

      // Try to register again with same email
      await api.post('/auth/register', userData, { expect: 409 });

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });
  });

  describe('2. USER PROFILE MANAGEMENT', () => {
    let testUser: RegisteredUser;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: 'profile.test@example.com',
        password: 'password123',
        fullName: 'Profile Test User',
      });
    });

    it('should get user by ID successfully', async () => {
      const body = await api.get<UserResponse>(`/users/${testUser.id}`, {
        token: testUser.accessToken,
        expect: 200,
      });

      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testUser.id);
      expect(body.data.email).toBe(testUser.email);
      expect(body.data.userProfile).toBeDefined();
      expect(body.data.userProfile.fullName).toBe(testUser.fullName);
    });

    it('should update user full name successfully', async () => {
      const updateData = {
        fullName: 'Updated Test User',
      };

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.userProfile.fullName).toBe(updateData.fullName);
    });

    it('should update user email successfully', async () => {
      const newEmail = 'updated1.email@example.com';
      const updateData = {
        email: newEmail,
      };

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.email).toBe(newEmail);
    });

    it('should update user password successfully', async () => {
      const updateData = {
        password: 'newPassword123',
      };

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);

      // Verify login with new password works
      await api.post(
        '/auth/login-base',
        {
          // email: testUser.email,
          email: 'updated1.email@example.com',
          password: 'newPassword123',
        },
        { expect: 200 },
      );
    });

    it('should update user date of birth successfully', async () => {
      const updateData = {
        dateOfBirth: '1990-01-01',
      };

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      const receivedDate = body.data.userProfile.dateOfBirth?.split('T')[0];

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

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.userProfile.biography).toBeDefined();
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

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.userProfile.fullName).toBe(updateData.fullName);
      expect(body.data.userProfile.dateOfBirth?.split('T')[0]).toBe(
        updateData.dateOfBirth,
      );
      expect(body.data.userProfile.biography).toBeDefined();
    });
  });

  describe('3. VALIDATION CASES', () => {
    let testUser: RegisteredUser;

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

      await api.post('/auth/register', userData, { expect: 400 });
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'short.pass@example.com',
        password: '123', // Less than 6 characters
        fullName: 'Test User',
      };

      await api.post('/auth/register', userData, { expect: 400 });
    });

    it('should reject registration with empty name', async () => {
      const userData = {
        email: 'empty.name@example.com',
        password: 'password123',
        fullName: '',
      };

      await api.post('/auth/register', userData, { expect: 400 });
    });

    it('should reject update with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email-format',
      };

      await api.patch(`/users/${testUser.id}`, updateData, {
        token: testUser.accessToken,
        expect: 400,
      });
    });

    it('should reject update with invalid biography JSON', async () => {
      const updateData = {
        biography: 'invalid json string {',
      };

      await api.patch(`/users/${testUser.id}`, updateData, {
        token: testUser.accessToken,
        expect: 400,
      });
    });

    it('should reject update with invalid date format', async () => {
      const updateData = {
        dateOfBirth: 'invalid-date',
      };

      await api.patch(`/users/${testUser.id}`, updateData, {
        token: testUser.accessToken,
        expect: 400,
      });
    });
  });

  describe('4. AUTHORIZATION CASES', () => {
    describe('4.1 Unauthorized Access (401)', () => {
      it('should reject get user without authentication', async () => {
        await api.get('/users/some-user-id', { expect: 401 });
      });

      it('should reject update user without authentication', async () => {
        await api.patch(
          '/users/some-user-id',
          { fullName: 'Updated Name' },
          {
            expect: 401,
          },
        );
      });

      it('should reject login without credentials', async () => {
        await api.post('/auth/login-base', {}, { expect: 400 });
      });
    });

    describe('4.2 Permission Violations (403)', () => {
      let user1: RegisteredUser;
      let user2: RegisteredUser;

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

        await api.patch(`/users/${user2.id}`, updateData, {
          token: user1.accessToken,
          expect: 403,
        });
      });

      it('should reject user trying to get another user', async () => {
        await api.get(`/users/${user2.id}`, {
          token: user1.accessToken,
          expect: 404,
        });
      });
    });
  });

  describe('5. FILE UPLOAD TESTS', () => {
    let testUser: RegisteredUser;

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

      const body = await api.upload<UserResponse>(
        'patch',
        `/users/${testUser.id}`,
        {},
        [{ fieldName: 'avatar', buffer: jpegBuffer, filename: 'avatar.jpg' }],
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.userProfile.avatar).toBeDefined();
      expect(typeof body.data.userProfile.avatar).toBe('string');
    });

    it('should reject upload with invalid file type', async () => {
      const invalidFile = Buffer.from('fake text content');

      await api.upload(
        'patch',
        `/users/${testUser.id}`,
        {},
        [{ fieldName: 'avatar', buffer: invalidFile, filename: 'test.txt' }],
        { token: testUser.accessToken, expect: 400 },
      );
    });

    it('should reject upload with oversized file', async () => {
      // Create a large buffer (assuming max size is 2MB, we'll use 3MB)
      const largeFile = Buffer.alloc(3 * 1024 * 1024, 'x');

      await api.upload(
        'patch',
        `/users/${testUser.id}`,
        {},
        [{ fieldName: 'avatar', buffer: largeFile, filename: 'large.jpg' }],
        { token: testUser.accessToken, expect: 400 },
      );
    });

    it('should handle avatar upload with empty request body', async () => {
      const jpegBuffer = readFileSync(join(__dirname, '1099451.jpg'));

      const body = await api.upload<UserResponse>(
        'patch',
        `/users/${testUser.id}`,
        {},
        [{ fieldName: 'avatar', buffer: jpegBuffer, filename: 'avatar2.jpg' }],
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
    });

    it('should handle update without file (file is optional)', async () => {
      const updateData = {
        fullName: 'Updated without file',
      };

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
    });
  });

  describe('6. DATABASE / BUSINESS LOGIC CASES', () => {
    it('should return 404 for non-existent user', async () => {
      const testUser = await createTestUser({
        email: 'notfound.test@example.com',
        password: 'password123',
        fullName: 'Not Found Test User',
      });

      await api.get('/users/non-existent-user-id', {
        token: testUser.accessToken,
        expect: 404,
      });
    });

    it('should handle user update with no changes', async () => {
      const testUser = await createTestUser({
        email: 'nochange.test@example.com',
        password: 'password123',
        fullName: 'No Change Test User',
      });

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        {},
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
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

      const body = await api.patch<UserResponse>(
        `/users/${testUser.id}`,
        updateData,
        { token: testUser.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.userProfile.biography).toBeDefined();
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

      const registerBody = await api.post<AuthResponse>(
        '/auth/register',
        userData,
        { expect: 201 },
      );

      const id = registerBody.data.user.id;
      const accessToken = registerBody.data.tokens.accessToken;

      // Step 2: Login to verify credentials work
      const loginBody = await api.post<AuthResponse>(
        '/auth/login-base',
        {
          email: userData.email,
          password: userData.password,
        },
        { expect: 200 },
      );

      expect(loginBody.data.user.id).toBe(id);

      // Step 3: Get initial user data
      const getBody = await api.get<UserResponse>(`/users/${id}`, {
        token: accessToken,
        expect: 200,
      });

      expect(getBody.data.email).toBe(userData.email);
      expect(getBody.data.userProfile.fullName).toBe(userData.fullName);

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

      const updateBody = await api.patch<UserResponse>(
        `/users/${id}`,
        updateData,
        { token: accessToken, expect: 200 },
      );

      expect(updateBody.success).toBe(true);
      expect(updateBody.data.userProfile.fullName).toBe(updateData.fullName);
      expect(updateBody.data.userProfile.dateOfBirth?.split('T')[0]).toBe(
        updateData.dateOfBirth,
      );

      // Step 5: Upload avatar
      const jpegBuffer = readFileSync(join(__dirname, '1099451.jpg'));

      const avatarBody = await api.upload<UserResponse>(
        'patch',
        `/users/${id}`,
        {},
        [
          {
            fieldName: 'avatar',
            buffer: jpegBuffer,
            filename: 'integration-avatar.jpg',
          },
        ],
        { token: accessToken, expect: 200 },
      );

      expect(avatarBody.success).toBe(true);
      expect(avatarBody.data.userProfile.avatar).toBeDefined();

      // Step 6: Verify final user state
      const finalBody = await api.get<UserResponse>(`/users/${id}`, {
        token: accessToken,
        expect: 200,
      });

      expect(finalBody.data.userProfile.fullName).toBe(updateData.fullName);
      expect(finalBody.data.userProfile.dateOfBirth?.split('T')[0]).toBe(
        updateData.dateOfBirth,
      );
      expect(finalBody.data.userProfile.biography).toBeDefined();
      expect(finalBody.data.userProfile.avatar).toBeDefined();

      // Step 7: Verify login still works after updates
      await api.post(
        '/auth/login-base',
        {
          email: userData.email,
          password: userData.password,
        },
        { expect: 200 },
      );

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

      const registerBody = await api.post<AuthResponse>(
        '/auth/register',
        userData,
        { expect: 201 },
      );

      const id = registerBody.data.user.id;
      const accessToken = registerBody.data.tokens.accessToken;

      // Step 2: Update password
      const newPassword = 'newPassword456';
      const updateData = {
        password: newPassword,
      };

      await api.patch(`/users/${id}`, updateData, {
        token: accessToken,
        expect: 200,
      });

      // Step 3: Verify login with new password works
      await api.post(
        '/auth/login-base',
        {
          email: userData.email,
          password: newPassword,
        },
        { expect: 200 },
      );

      // Step 4: Verify login with old password fails
      await api.post(
        '/auth/login-base',
        {
          email: userData.email,
          password: userData.password,
        },
        { expect: 401 },
      );

      // Add to cleanup
      testUsers.push({ email: userData.email });
    });
  });
});
