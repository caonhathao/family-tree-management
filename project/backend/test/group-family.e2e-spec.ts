import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { USER_ROLE } from '@prisma/client';

/**
 * E2E Tests for Group Family Module
 *
 * Test Flow Description:
 * 1. Group Creation - Leader creates new group family
 * 2. Group Management - Update, retrieve group information
 * 3. Permission Control - Leader vs non-leader access
 * 4. Group Join - Users join via invitation tokens
 * 5. Data Consistency - Verify database constraints and relationships
 *
 * Key Database Constraints:
 * - GroupMember: @@unique([memberId, groupId]) - Composite key
 * - GroupMember.isLeader: Boolean field (critical for permissions)
 * - Invite.token: Unique field for group invitations
 *
 * Permission Matrix:
 * - Leader: Can update group, create invites, remove members
 * - Non-Leader: Can view group, join via tokens, limited actions
 * - Non-Member: 404 for group-specific operations
 */

describe('Group Family E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data storage for cleanup
  const testUsers: any[] = [];
  const testGroups: any[] = [];
  const testInvites: any[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // Match main.ts configuration
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
    // Final cleanup of users
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

  afterEach(async () => {
    // Clean up test data after each test to avoid P2002 unique constraint errors
    if (testGroups.length > 0) {
      await prisma.groupMember.deleteMany({
        where: {
          groupId: {
            in: testGroups.map((group) => group.id),
          },
        },
      });

      await prisma.groupFamily.deleteMany({
        where: {
          id: {
            in: testGroups.map((group) => group.id),
          },
        },
      });
    }

    if (testInvites.length > 0) {
      await prisma.invite.deleteMany({
        where: {
          token: {
            in: testInvites.map((invite) => invite.token),
          },
        },
      });
    }

    // Clear arrays
    testGroups.length = 0;
    testInvites.length = 0;
  });

  // Helper functions
  const createTestUser = async (userData: any) => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    testUsers.push({ email: userData.email });
    return {
      user: response.body.data.user,
      tokens: response.body.data.tokens,
    };
  };

  const createTestGroup = async (leaderToken: string, groupData: any) => {
    const response = await request(app.getHttpServer())
      .post('/api/group-family')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send(groupData)
      .expect(201);

    testGroups.push(response.body.data);
    return response.body.data;
  };

  describe('1. GROUP CREATION (POST /api/group-family)', () => {
    it('should create group family successfully with leader privileges', async () => {
      const leaderData = {
        email: `leader.group.create${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Group Leader Test',
      };

      const { tokens } = await createTestUser(leaderData);
      const groupData = {
        name: 'Test Group Family',
        description: 'A test group for E2E testing',
      };

      const response = await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBe(groupData.description);

      // Verify leader was added to group in database
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId: response.body.data.id,
          member: {
            email: leaderData.email,
          },
        },
        select: {
          role: true,
          isLeader: true,
        },
      });

      expect(groupMember).toBeDefined();
      if (groupMember) {
        expect(groupMember.role).toBe(USER_ROLE.OWNER);
        expect(groupMember.isLeader).toBe(true);
      }
    });

    it('should reject group creation without authentication', async () => {
      const groupData = {
        name: 'Unauthorized Group',
        description: 'Should not be created',
      };

      await request(app.getHttpServer())
        .post('/api/group-family')
        .send(groupData)
        .expect(401);
    });

    it('should reject group creation with invalid name (too short)', async () => {
      const userData = {
        email: `invalid.name${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Invalid Name User',
      };

      const { tokens } = await createTestUser(userData);
      const groupData = {
        name: 'abc', // Too short (minimum 6)
        description: 'Should fail validation',
      };

      await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send(groupData)
        .expect(400);
    });

    it('should reject group creation with invalid name (too long)', async () => {
      const userData = {
        email: `long.name${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Long Name User',
      };

      const { tokens } = await createTestUser(userData);
      const groupData = {
        name: 'a'.repeat(31), // Too long (maximum 30)
        description: 'Should fail validation',
      };

      await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send(groupData)
        .expect(400);
    });

    it('should create group without optional description', async () => {
      const userData = {
        email: `no.desc${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'No Description User',
      };

      const { tokens } = await createTestUser(userData);
      const groupData = {
        name: 'Group Without Description',
      };

      const response = await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.data.description).toBeNull();
    });
  });

  describe('2. GROUP RETRIEVAL (GET /api/group-family)', () => {
    let leaderToken: string;
    let memberToken: string;
    let testGroup: any;

    beforeEach(async () => {
      // Setup test users and group for each test
      const leaderData = {
        email: `leader.retrieve${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Retrieve Leader',
      };

      const memberData = {
        email: `member.retrieve${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Retrieve Member',
      };

      const leaderResult = await createTestUser(leaderData);
      const memberResult = await createTestUser(memberData);

      leaderToken = leaderResult.tokens.accessToken;
      memberToken = memberResult.tokens.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Retrieve Test Group',
        description: 'Group for testing retrieval',
      });

      // Add member to group
      const invite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leaderResult.user.id,
          token: `test-invite-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      testInvites.push(invite);

      await request(app.getHttpServer())
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ token: invite.token })
        .expect(200);
    });

    it('should get all groups for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/group-family')
        .set('Authorization', `Bearer ${leaderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const foundGroup = response.body.data.find(
        (group: any) => group.id === testGroup.id,
      );
      expect(foundGroup).toBeDefined();
      expect(foundGroup.name).toBe(testGroup.name);
    });

    it('should get specific group by ID for member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/group-family/${testGroup.id}`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testGroup.id);
      expect(response.body.data.name).toBe(testGroup.name);
      expect(response.body.data.description).toBe(testGroup.description);
      expect(response.body.data.groupMembers).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should reject getting group for non-member', async () => {
      const nonMemberData = {
        email: `nonmember${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Non Member User',
      };

      const { tokens } = await createTestUser(nonMemberData);

      await request(app.getHttpServer())
        .get(`/api/group-family/${testGroup.id}`)
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(404);
    });

    it('should reject getting group with invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/group-family/invalid-uuid')
        .set('Authorization', `Bearer ${leaderToken}`)
        .expect(404);
    });

    it('should reject getting groups without authentication', async () => {
      await request(app.getHttpServer()).get('/api/group-family').expect(401);
    });
  });

  describe('3. GROUP UPDATE (PATCH /api/group-family/:id)', () => {
    let leaderToken: string;
    let memberToken: string;
    let testGroup: any;

    beforeEach(async () => {
      // Setup test users and group for each test
      const leaderData = {
        email: `leader.update${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Update Leader',
      };

      const memberData = {
        email: `member.update${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Update Member',
      };

      const leaderResult = await createTestUser(leaderData);
      const memberResult = await createTestUser(memberData);

      leaderToken = leaderResult.tokens.accessToken;
      memberToken = memberResult.tokens.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Update Test Group',
        description: 'Original description',
      });

      // Add non-leader member to test permissions
      const invite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leaderResult.user.id,
          token: `test-invite-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      testInvites.push(invite);

      await request(app.getHttpServer())
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ token: invite.token })
        .expect(200);
    });

    it('should allow leader to update group', async () => {
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/group-family/${testGroup.id}`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should reject group update by non-leader member', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch(`/api/group-family/${testGroup.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)
        .expect(404); // Service returns 404 for non-leader
    });

    it('should reject group update with empty name', async () => {
      await request(app.getHttpServer())
        .patch(`/api/group-family/${testGroup.id}`)
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({ name: '' })
        .expect(400);
    });

    it('should reject group update for non-existent group', async () => {
      const updateData = {
        name: 'Non-existent Group',
      };

      await request(app.getHttpServer())
        .patch('/api/group-family/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('4. GROUP JOIN (POST /api/group-family/join)', () => {
    let leaderToken: string;
    let testGroup: any;
    let validInvite: any;

    beforeEach(async () => {
      const leaderData = {
        email: `leader.join${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Join Leader',
      };

      const leaderResult = await createTestUser(leaderData);
      leaderToken = leaderResult.tokens.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Join Test Group',
        description: 'Group for testing join functionality',
      });

      validInvite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leaderResult.user.id,
          token: `valid-join-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      testInvites.push(validInvite);
    });

    it('should allow user to join group with valid token', async () => {
      const userData = {
        email: `new.member${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'New Member',
      };

      const { tokens } = await createTestUser(userData);

      const response = await request(app.getHttpServer())
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .query({ token: validInvite.token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupId).toBe(testGroup.id);
      expect(response.body.data.memberId).toBeDefined();
      expect(response.body.data.role).toBe(USER_ROLE.VIEWER);
      expect(response.body.data.isLeader).toBe(false);

      // Verify membership in database
      const membership = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: testGroup.id,
            memberId: response.body.data.memberId,
          },
        },
      });

      expect(membership).toBeDefined();
      if (membership) {
        expect(membership.role).toBe(USER_ROLE.VIEWER);
        expect(membership.isLeader).toBe(false);
      }
    });

    it('should reject joining with invalid token', async () => {
      const userData = {
        email: `invalid.token${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Invalid Token User',
      };

      const { tokens } = await createTestUser(userData);

      await request(app.getHttpServer())
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .query({ token: 'invalid-token-123' })
        .expect(404);
    });

    it('should reject joining without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/group-family/join')
        .query({ token: validInvite.token })
        .expect(401);
    });
  });

  describe('5. isLeader FIELD VERIFICATION', () => {
    it('should handle isLeader field correctly during group creation', async () => {
      const leaderData = {
        email: `leader.check${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Leader Check User',
      };

      const leaderResult = await createTestUser(leaderData);

      const response = await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${leaderResult.tokens.accessToken}`)
        .send({
          name: 'Leader Check Group',
        })
        .expect(201);

      const groupId = response.body.data.id;

      // Verify actual database state
      const membership = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: groupId,
            memberId: leaderResult.user.id,
          },
        },
        select: {
          isLeader: true,
        },
      });

      expect(membership).toBeDefined();
      if (membership) {
        expect(membership.isLeader).toBe(true);
      }
    });
  });

  describe('6. ERROR HANDLING & EDGE CASES', () => {
    it('should handle malformed requests gracefully', async () => {
      const userData = {
        email: `error.user${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Error Test User',
      };

      const { tokens } = await createTestUser(userData);

      await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should add debug logging for 400/500 errors', async () => {
      const userData = {
        email: `debug.user${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Debug User',
      };

      const { tokens } = await createTestUser(userData);

      const response = await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          name: 'abc', // Invalid - too short
        })
        .expect(400);

      // Console log the response body for debugging
      console.log('400 Error Response:', response.body);
      expect(response.body).toBeDefined();
    });
  });

  describe('7. INTEGRATION TESTS', () => {
    it('should complete full group lifecycle: Create -> Join -> Update -> Verify', async () => {
      // Create leader
      const leaderData = {
        email: `lifecycle.leader${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Lifecycle Leader',
      };

      const leaderResult = await createTestUser(leaderData);

      // Create group
      const groupResponse = await request(app.getHttpServer())
        .post('/api/group-family')
        .set('Authorization', `Bearer ${leaderResult.tokens.accessToken}`)
        .send({
          name: 'Lifecycle Test Group',
          description: 'Testing complete lifecycle',
        })
        .expect(201);

      const groupId = groupResponse.body.data.id;

      // Create invite
      const invite = await prisma.invite.create({
        data: {
          groupId: groupId,
          senderId: leaderResult.user.id,
          token: `lifecycle-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      testInvites.push(invite);

      // Create member
      const memberData = {
        email: `lifecycle.member${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Lifecycle Member',
      };

      const memberResult = await createTestUser(memberData);

      // Member joins group
      await request(app.getHttpServer())
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${memberResult.tokens.accessToken}`)
        .query({ token: invite.token })
        .expect(200);

      // Leader updates group
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/group-family/${groupId}`)
        .set('Authorization', `Bearer ${leaderResult.tokens.accessToken}`)
        .send({
          name: 'Updated Lifecycle Group',
          description: 'Updated description',
        })
        .expect(200);

      // Verify final state
      const finalGroup = await request(app.getHttpServer())
        .get(`/api/group-family/${groupId}`)
        .set('Authorization', `Bearer ${leaderResult.tokens.accessToken}`)
        .expect(200);

      expect(finalGroup.body.data.name).toBe('Updated Lifecycle Group');
      expect(finalGroup.body.data.description).toBe('Updated description');
      expect(finalGroup.body.data.groupMembers).toBeDefined();
      expect(finalGroup.body.data.groupMembers.length).toBe(2); // Leader + Member
    });
  });
});
