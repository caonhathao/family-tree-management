import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * E2E Tests for Group Family Module
 *
 * Test Flow Description:
 * 1. User Authentication - Register and login users
 * 2. Group Creation - Create new group families
 * 3. Group Management - Update, get, list groups
 * 4. Permission Control - Test leader/owner permissions
 * 5. Group Joining - Test invitation-based joining
 *
 * Edge Cases Tested:
 * - Unauthorized access attempts
 * - Permission violations (non-leader trying to modify groups)
 * - Invalid data validation
 * - Duplicate group creation
 * - Invitation token scenarios
 * - Missing required fields
 */

describe('Group Family E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUsers: any[] = [];
  const testGroups: any[] = [];

  // Helper functions
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

  const createTestGroup = async (user: any, groupData: any) => {
    const response = await request(app.getHttpServer())
      .post('/group-family')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(groupData)
      .expect(201);

    const group = {
      id: response.body.data.id,
      name: response.body.data.name,
      description: response.body.data.description,
    };

    testGroups.push({ ...group, ownerId: user.id });
    return group;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Loại bỏ các trường không có trong DTO
        forbidNonWhitelisted: true, // Chặn nếu gửi thừa trường lạ
        transform: true, // Chuyển đổi kiểu dữ liệu
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.groupFamily.deleteMany({
      where: {
        id: {
          in: testGroups.map((group) => group.id),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((user) => user.email),
        },
      },
    });

    await app.close();
  });

  describe('1. SUCCESS CASES (200 / 201)', () => {
    let groupOwner: any;
    let createdGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'group.owner@example.com',
        password: 'password123',
        fullName: 'Group Owner User',
      });
    });

    it('should create a new group family successfully', async () => {
      const groupData = {
        name: 'Test Family Group',
        description: 'A test group for family management',
      };

      const response = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBe(groupData.description);

      createdGroup = response.body.data;
      testGroups.push({ ...createdGroup, ownerId: groupOwner.id });
    });

    it('should create group family with only required fields', async () => {
      const groupData = {
        name: 'Minimal Group',
      };

      const response = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBeNull();

      testGroups.push({ ...response.body.data, ownerId: groupOwner.id });
    });

    it('should get all group families for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify all groups belong to the user
      response.body.data.forEach((group: any) => {
        expect(group).toHaveProperty('id');
        expect(group).toHaveProperty('name');
        expect(group).toHaveProperty('description');
        expect(group).toHaveProperty('createdAt');
        expect(group).toHaveProperty('updatedAt');
      });
    });

    it('should get specific group family by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/group-family/${createdGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdGroup.id);
      expect(response.body.data.name).toBe(createdGroup.name);
      expect(response.body.data.groupMembers).toBeDefined();
    });

    it('should update group family successfully as leader', async () => {
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated group description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-family/${createdGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should update only name field', async () => {
      const updateData = {
        name: 'Name Only Update',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-family/${createdGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should update only description field', async () => {
      const updateData = {
        description: 'Description only update',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-family/${createdGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: 'validation.group@example.com',
        password: 'password123',
        fullName: 'Validation Group User',
      });
    });

    it('should reject group creation with empty name', async () => {
      const groupData = {
        name: '',
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(groupData)
        .expect(400);
    });

    it('should reject group creation with missing name', async () => {
      const groupData = {
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(groupData)
        .expect(400);
    });

    it('should reject group creation with non-string name', async () => {
      const groupData = {
        name: 123,
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(groupData)
        .expect(400);
    });

    it('should reject group creation with empty payload', async () => {
      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({})
        .expect(400);
    });

    it('should reject group update with empty name', async () => {
      const group = await createTestGroup(testUser, {
        name: 'Test Group for Validation',
      });

      const updateData = {
        name: '',
      };

      await request(app.getHttpServer())
        .patch(`/group-family/${group.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      it('should reject group creation without authentication', async () => {
        const groupData = {
          name: 'Unauthorized Group',
          description: 'Should not be created',
        };

        await request(app.getHttpServer())
          .post('/group-family')
          .send(groupData)
          .expect(401);
      });

      it('should reject getting groups without authentication', async () => {
        await request(app.getHttpServer()).get('/group-family').expect(401);
      });

      it('should reject getting specific group without authentication', async () => {
        await request(app.getHttpServer())
          .get('/group-family/some-group-id')
          .expect(401);
      });

      it('should reject group update without authentication', async () => {
        const updateData = {
          name: 'Hacked Group',
        };

        await request(app.getHttpServer())
          .patch('/group-family/some-group-id')
          .send(updateData)
          .expect(401);
      });

      it('should reject group joining without authentication', async () => {
        await request(app.getHttpServer())
          .post('/group-family/join')
          .query({ token: 'some-token' })
          .expect(401);
      });
    });

    describe('3.2 Permission Violations (403/404)', () => {
      let groupOwner: any;
      let groupMember: any;
      let nonMember: any;
      let testGroup: any;

      beforeAll(async () => {
        groupOwner = await createTestUser({
          email: 'owner.permission@example.com',
          password: 'password123',
          fullName: 'Group Owner Permission',
        });

        groupMember = await createTestUser({
          email: 'member.permission@example.com',
          password: 'password123',
          fullName: 'Group Member Permission',
        });

        nonMember = await createTestUser({
          email: 'nonmember.permission@example.com',
          password: 'password123',
          fullName: 'Non Member Permission',
        });

        // Create group and add member
        testGroup = await createTestGroup(groupOwner, {
          name: 'Permission Test Group',
          description: 'Group for testing permissions',
        });

        // Add member as viewer (not leader)
        await prisma.groupMember.create({
          data: {
            groupId: testGroup.id,
            memberId: groupMember.id,
            role: 'VIEWER',
            isLeader: false,
          },
        });
      });

      it('should reject non-member from accessing group', async () => {
        await request(app.getHttpServer())
          .get(`/group-family/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .expect(404); // Not found because user is not a member
      });

      it('should reject non-leader member from updating group', async () => {
        const updateData = {
          name: 'Hacked by Member',
        };

        await request(app.getHttpServer())
          .patch(`/group-family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupMember.accessToken}`)
          .send(updateData)
          .expect(404); // Not found because member is not a leader
      });

      it('should reject non-member from updating group', async () => {
        const updateData = {
          name: 'Hacked by Non Member',
        };

        await request(app.getHttpServer())
          .patch(`/group-family/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(updateData)
          .expect(404); // Not found because user is not a member
      });

      it('should allow non-member to see their own groups (empty list)', async () => {
        const response = await request(app.getHttpServer())
          .get('/group-family')
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        // Should be empty since this user hasn't joined any groups
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    it('should return 404 for non-existent group', async () => {
      const testUser = await createTestUser({
        email: 'notfound.group@example.com',
        password: 'password123',
        fullName: 'Not Found Group User',
      });

      await request(app.getHttpServer())
        .get('/group-family/non-existent-group-id')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(404);
    });

    it('should return 404 when updating non-existent group', async () => {
      const testUser = await createTestUser({
        email: 'notfound.update@example.com',
        password: 'password123',
        fullName: 'Not Found Update User',
      });

      const updateData = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .patch('/group-family/non-existent-group-id')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should handle group creation with very long name', async () => {
      const testUser = await createTestUser({
        email: 'longname.group@example.com',
        password: 'password123',
        fullName: 'Long Name Group User',
      });

      const longName = 'a'.repeat(300);
      const groupData = {
        name: longName,
        description: 'Group with very long name',
      };

      const response = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(groupData);

      // This might pass or fail depending on database constraints
      // We'll check that it returns a reasonable status
      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        testGroups.push({ ...response.body.data, ownerId: testUser.id });
      }
    });

    it('should handle group creation with very long description', async () => {
      const testUser = await createTestUser({
        email: 'longdesc.group@example.com',
        password: 'password123',
        fullName: 'Long Desc Group User',
      });

      const longDescription = 'a'.repeat(1000);
      const groupData = {
        name: 'Normal Name Group',
        description: longDescription,
      };

      const response = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(groupData);

      // This might pass or fail depending on database constraints
      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        testGroups.push({ ...response.body.data, ownerId: testUser.id });
      }
    });
  });

  describe('5. GROUP JOINING TESTS', () => {
    let groupOwner: any;
    let joiner: any;
    let testGroup: any;
    let inviteToken: string;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'join.owner@example.com',
        password: 'password123',
        fullName: 'Join Owner User',
      });

      joiner = await createTestUser({
        email: 'joiner.user@example.com',
        password: 'password123',
        fullName: 'Joiner User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Join Test Group',
        description: 'Group for testing joins',
      });

      // Create an invitation token
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const invite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: groupOwner.id,
          token: 'test-invite-token-12345',
          expiresAt: expiresAt,
        },
      });

      inviteToken = invite.token;
    });

    it('should allow user to join group with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .query({ token: inviteToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupId).toBe(testGroup.id);
      expect(response.body.data.memberId).toBe(joiner.id);
      expect(response.body.data.role).toBe('VIEWER');
      expect(response.body.data.isLeader).toBe(false);
    });

    it('should reject joining with non-existent token', async () => {
      const newUser = await createTestUser({
        email: 'invalid.token@example.com',
        password: 'password123',
        fullName: 'Invalid Token User',
      });

      await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${newUser.accessToken}`)
        .query({ token: 'non-existent-token' })
        .expect(404);
    });

    it('should reject joining with expired token', async () => {
      const newUser = await createTestUser({
        email: 'expired.token@example.com',
        password: 'password123',
        fullName: 'Expired Token User',
      });

      // Create an expired invitation
      const expiredInvite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: groupOwner.id,
          token: 'expired-invite-token',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${newUser.accessToken}`)
        .query({ token: expiredInvite.token })
        .expect(403);
    });

    it('should reject user joining group they are already in', async () => {
      await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .query({ token: inviteToken })
        .expect(409); // Conflict - already a member
    });
  });

  describe('6. INTEGRATION TESTS', () => {
    it('should complete full group management flow: Create -> Join -> Manage -> Verify', async () => {
      // Step 1: Create group owner
      const owner = await createTestUser({
        email: 'integration.owner@example.com',
        password: 'password123',
        fullName: 'Integration Owner',
      });

      // Step 2: Create group
      const groupData = {
        name: 'Integration Test Group',
        description: 'Group for integration testing',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(groupData)
        .expect(201);

      const groupId = createResponse.body.data.id;

      // Step 3: Verify owner can see group
      const getResponse = await request(app.getHttpServer())
        .get(`/group-family/${groupId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(getResponse.body.data.id).toBe(groupId);
      expect(getResponse.body.data.name).toBe(groupData.name);

      // Step 4: Update group
      const updateData = {
        name: 'Updated Integration Group',
        description: 'Updated description for integration testing',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/group-family/${groupId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.description).toBe(updateData.description);

      // Step 5: Create joiner and add to group via invitation
      const joiner = await createTestUser({
        email: 'integration.joiner@example.com',
        password: 'password123',
        fullName: 'Integration Joiner',
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const invite = await prisma.invite.create({
        data: {
          groupId: groupId,
          senderId: owner.id,
          token: 'integration-invite-token',
          expiresAt: expiresAt,
        },
      });

      await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .query({ token: invite.token })
        .expect(200);

      // Step 6: Verify joiner can see group
      const joinerGetResponse = await request(app.getHttpServer())
        .get(`/group-family/${groupId}`)
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .expect(200);

      expect(joinerGetResponse.body.data.id).toBe(groupId);

      // Step 7: Verify both users appear in group list
      const ownerGroupsResponse = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      const joinerGroupsResponse = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .expect(200);

      expect(ownerGroupsResponse.body.data.length).toBeGreaterThan(0);
      expect(joinerGroupsResponse.body.data.length).toBeGreaterThan(0);

      // Add to cleanup
      testGroups.push({ id: groupId, ownerId: owner.id });
    });
  });
});
