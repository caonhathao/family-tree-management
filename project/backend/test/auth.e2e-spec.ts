import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * E2E Tests for Authentication Module
 *
 * Test Flow Description:
 * 1. User Registration - Create new account with email/password
 * 2. User Login - Authenticate with credentials
 * 3. Token Refresh - Renew access tokens
 * 4. Authentication Validation - Test various auth scenarios
 *
 * Edge Cases Tested:
 * - Invalid registration data (missing fields, invalid email, weak password)
 * - Duplicate email registration
 * - Invalid login credentials
 * - Token refresh scenarios (valid, expired, invalid)
 * - Authentication bypass attempts
 */

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUsers: any[] = [];

  // Test data templates
  const validUser = {
    email: 'test.auth@example.com',
    password: 'password123',
    fullName: 'Test Auth User',
  };

  const invalidUsers = [
    {
      description: 'missing email',
      data: { password: 'password123', fullName: 'Test User' },
    },
    {
      description: 'invalid email format',
      data: {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
      },
    },
    {
      description: 'missing password',
      data: { email: 'test@example.com', fullName: 'Test User' },
    },
    {
      description: 'short password',
      data: {
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
      },
    },
    {
      description: 'missing full name',
      data: { email: 'test@example.com', password: 'password123' },
    },
    {
      description: 'empty full name',
      data: {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
      },
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUsers.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: testUsers.map((user) => user.email),
          },
        },
      });
    }
    await app.close();
  });

  describe('1. SUCCESS CASES (200 / 201)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      console.log('auth response test:', response.body);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.userProfile.fullName).toBe(
        validUser.fullName,
      );
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      testUsers.push({ email: validUser.email });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      const { refreshToken } = loginResponse.body.data.tokens;

      // Use refresh token to get new tokens
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set(
          'Authorization',
          `Bearer ${loginResponse.body.data.tokens.refreshToken}`,
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(validUser.email);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    it.each(invalidUsers)(
      'should reject registration with $description',
      async ({ data }) => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(data)
          .expect(400);
      },
    );

    it('should reject login with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: 'invalid-email',
          password: validUser.password,
        })
        .expect(400);
    });

    it('should reject login with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: validUser.email,
          password: '123',
        })
        .expect(400);
    });

    it('should reject registration with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(409); // Conflict - email already exists
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      it('should reject refresh token without authorization header', async () => {
        await request(app.getHttpServer()).post('/auth/refresh').expect(401);
      });

      it('should reject refresh token with invalid token format', async () => {
        await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Authorization', 'InvalidFormat token')
          .expect(401);
      });

      it('should reject refresh token with invalid JWT', async () => {
        await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Authorization', 'Bearer invalid.jwt.token')
          .expect(401);
      });
    });

    describe('3.2 AUTHENTICATION FAILURES (401/404)', () => {
      it('should reject login with non-existent email', async () => {
        await request(app.getHttpServer())
          .post('/auth/login-base')
          .send({
            email: 'nonexistent@example.com',
            password: validUser.password,
          })
          .expect(404); // User not found
      });

      it('should reject login with wrong password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login-base')
          .send({
            email: validUser.email,
            password: 'wrongpassword',
          })
          .expect(401); // Invalid credentials
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    it('should create user profile and account during registration', async () => {
      const uniqueUser = {
        email: 'unique.profile@example.com',
        password: 'password123',
        fullName: 'Unique Profile User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(uniqueUser)
        .expect(201);

      expect(response.body.data.user.userProfile).toBeDefined();
      expect(response.body.data.user.userProfile.fullName).toBe(
        uniqueUser.fullName,
      );

      testUsers.push({ email: uniqueUser.email });
    });

    it('should store session information in database', async () => {
      const uniqueUser = {
        email: 'session.test@example.com',
        password: 'password123',
        fullName: 'Session Test User',
      };

      // Register and login to create session
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(uniqueUser)
        .expect(201);

      const { refreshToken } = registerResponse.body.data.tokens;

      // Check if session exists in database
      const session = await prisma.session.findFirst({
        where: {
          token: refreshToken,
          user: {
            email: uniqueUser.email,
          },
        },
      });

      expect(session).toBeDefined();
      expect(session?.userAgent).toBeDefined();
      expect(session?.ipAddress).toBeDefined();

      testUsers.push({ email: uniqueUser.email });
    });

    it('should handle refresh token expiration', async () => {
      const uniqueUser = {
        email: 'refresh.expire@example.com',
        password: 'password123',
        fullName: 'Refresh Expire User',
      };

      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(uniqueUser)
        .expect(201);

      const { accessToken, refreshToken } = registerResponse.body.data.tokens;

      // Manually expire the session in database
      await prisma.session.updateMany({
        where: {
          token: refreshToken,
        },
        data: {
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      // Try to refresh with expired session
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401); // Unauthorization - session expired

      testUsers.push({ email: uniqueUser.email });
    });
  });

  describe('5. SECURITY TESTS', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: validUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('hash');
      expect(response.body).not.toHaveProperty('salt');
    });

    it('should handle malformed JSON requests gracefully', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: longEmail,
          password: 'password123',
          fullName: 'Long Email User',
        })
        .expect(400);
    });

    it('should handle very long full names', async () => {
      const longName = 'a'.repeat(500);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'longname@example.com',
          password: 'password123',
          fullName: longName,
        })
        .expect(400);
    });
  });

  describe('6. INTEGRATION TESTS', () => {
    it('should complete full authentication flow: Register -> Login -> Refresh', async () => {
      const flowUser = {
        email: 'flow.test@example.com',
        password: 'password123',
        fullName: 'Flow Test User',
      };

      // Step 1: Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(flowUser)
        .expect(201);

      expect(registerResponse.body.data.tokens.accessToken).toBeDefined();
      expect(registerResponse.body.data.tokens.refreshToken).toBeDefined();

      // Step 2: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: flowUser.email,
          password: flowUser.password,
        })
        .expect(200);

      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();

      // Step 3: Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set(
          'Authorization',
          `Bearer ${loginResponse.body.data.tokens.refreshToken}`,
        )
        .expect(200);

      expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();
      expect(refreshResponse.body.data.user.email).toBe(flowUser.email);

      testUsers.push({ email: flowUser.email });
    });
  });
});
