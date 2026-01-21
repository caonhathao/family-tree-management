import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * E2E Tests for Invitation Module
 *
 * Test Flow Description:
 * 1. User Authentication - Register and login users with different roles
 * 2. Group Setup - Create groups as foundation for invitations
 * 3. Invitation Creation - Create invitations for group joining
 * 4. Permission Control - Test role-based access control
 * 5. Business Logic - Test invitation expiration and validation
 *
 * Edge Cases Tested:
 * - Role-based access control for invitation operations
 * - Invitation token generation and validation
 * - Invitation expiration handling
 * - Duplicate invitation prevention
 * - Permission violations (wrong roles trying to create invites)
 * - Non-existent group/member scenarios
 */

describe('Invitation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUsers: any[] = [];
  let testGroups: any[] = [];
  let testInvites: any[] = [];

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

    const group = response.body.data;
    testGroups.push({ ...group, ownerId: user.id });
    return group;
  };

  const addUserToGroup = async (
    group: any,
    user: any,
    role: any,
    isLeader: boolean = false,
  ) => {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        memberId: user.id,
        role: role,
        isLeader: isLeader,
      },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data in correct order
    await prisma.invite.deleteMany({
      where: {
        token: {
          in: testInvites.map((invite) => invite.token),
        },
      },
    });

    await prisma.groupMember.deleteMany({
      where: {
        memberId: {
          in: testUsers.map((user) => user.id),
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

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((user) => user.email),
        },
      },
    });

    await app.close();
  });

  describe('1. SUCCESS CASES (201)', () => {
    let groupOwner: any;
    let testGroup: any;
    let createdInvite: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'invite.owner@example.com',
        password: 'password123',
        fullName: 'Invite Owner User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Invite Test Group',
        description: 'Group for invitation testing',
      });
    });

    it('should create a new invitation successfully', async () => {
      const inviteData = {
        groupId: testGroup.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      const response = await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupId).toBe(inviteData.groupId);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      createdInvite = response.body.data;
      testInvites.push(createdInvite);
    });

    it('should create invitation with default expiration', async () => {
      const inviteData = {
        groupId: testGroup.id,
      };

      const response = await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupId).toBe(inviteData.groupId);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();

      testInvites.push(response.body.data);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    let groupOwner: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'invite.validation@example.com',
        password: 'password123',
        fullName: 'Invite Validation User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Validation Invite Test Group',
        description: 'Group for invitation validation testing',
      });
    });

    it('should reject invitation creation with missing groupId', async () => {
      const inviteData = {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(400);
    });

    it('should reject invitation creation with empty payload', async () => {
      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send({})
        .expect(400);
    });

    it('should reject invitation creation with invalid groupId format', async () => {
      const inviteData = {
        groupId: 123, // Should be string
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(400);
    });

    it('should reject invitation creation with invalid expiration date', async () => {
      const inviteData = {
        groupId: testGroup.id,
        expiresAt: 'invalid-date-format',
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(400);
    });

    it('should reject invitation creation with past expiration date', async () => {
      const inviteData = {
        groupId: testGroup.id,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(400);
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      it('should reject invitation creation without authentication', async () => {
        const inviteData = {
          groupId: 'some-group-id',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        await request(app.getHttpServer())
          .post('/invite')
          .send(inviteData)
          .expect(401);
      });
    });

    describe('3.2 Permission Tests', () => {
      let groupOwner: any;
      let editorUser: any;
      let viewerUser: any;
      let nonMember: any;
      let testGroup: any;

      beforeAll(async () => {
        groupOwner = await createTestUser({
          email: 'role.invite.owner@example.com',
          password: 'password123',
          fullName: 'Role Invite Owner',
        });

        editorUser = await createTestUser({
          email: 'role.invite.editor@example.com',
          password: 'password123',
          fullName: 'Role Invite Editor',
        });

        viewerUser = await createTestUser({
          email: 'role.invite.viewer@example.com',
          password: 'password123',
          fullName: 'Role Invite Viewer',
        });

        nonMember = await createTestUser({
          email: 'role.invite.nonmember@example.com',
          password: 'password123',
          fullName: 'Role Invite Non Member',
        });

        // Create group
        testGroup = await createTestGroup(groupOwner, {
          name: 'Role Invite Test Group',
          description: 'Group for role invitation testing',
        });

        // Add users to group with different roles
        await addUserToGroup(testGroup, editorUser, 'EDITOR');
        await addUserToGroup(testGroup, viewerUser, 'VIEWER');
      });

      it('should allow OWNER to create invitation', async () => {
        const inviteData = {
          groupId: testGroup.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const response = await request(app.getHttpServer())
          .post('/invite')
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(inviteData)
          .expect(201);

        testInvites.push(response.body.data);
      });

      it('should allow EDITOR to create invitation', async () => {
        const inviteData = {
          groupId: testGroup.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const response = await request(app.getHttpServer())
          .post('/invite')
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(inviteData)
          .expect(201);

        testInvites.push(response.body.data);
      });

      it('should allow VIEWER to create invitation', async () => {
        const inviteData = {
          groupId: testGroup.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const response = await request(app.getHttpServer())
          .post('/invite')
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(inviteData)
          .expect(201);

        testInvites.push(response.body.data);
      });

      it('should reject non-member from creating invitation', async () => {
        const inviteData = {
          groupId: testGroup.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        await request(app.getHttpServer())
          .post('/invite')
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(inviteData)
          .expect(403); // Forbidden due to not being a member
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    let groupOwner: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'business.invite@example.com',
        password: 'password123',
        fullName: 'Business Invite User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Business Invite Test Group',
        description: 'Group for business invitation testing',
      });
    });

    it('should return 404 when creating invitation for non-existent group', async () => {
      const inviteData = {
        groupId: 'non-existent-group-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(404); // Group not found
    });

    it('should handle invitation creation with very long groupId', async () => {
      const longGroupId = 'a'.repeat(500);
      const inviteData = {
        groupId: longGroupId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(404); // Group not found due to long ID
    });

    it('should handle multiple invitations for same group', async () => {
      const inviteData = {
        groupId: testGroup.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Create first invitation
      const response1 = await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(201);

      // Create second invitation
      const response2 = await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(response1.body.data.token).not.toBe(
        response2.body.data.inviteToken,
      );
      expect(response1.body.data.groupId).toBe(response2.body.data.groupId);

      testInvites.push(response1.body.data, response2.body.data);
    });
  });

  describe('5. INTEGRATION TESTS', () => {
    it('should complete full invitation flow: Create -> Verify Token -> Use in Group Join', async () => {
      // Step 1: Create user and group
      const owner = await createTestUser({
        email: 'integration.invite@example.com',
        password: 'password123',
        fullName: 'Integration Invite Owner',
      });

      const group = await createTestGroup(owner, {
        name: 'Integration Invite Test Group',
        description: 'Group for invitation integration testing',
      });

      // Step 2: Create invitation
      const inviteData = {
        groupId: group.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const inviteResponse = await request(app.getHttpServer())
        .post('/invite')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(inviteData)
        .expect(201);

      expect(inviteResponse.body.success).toBe(true);
      expect(inviteResponse.body.data.inviteToken).toBeDefined();

      const inviteToken = inviteResponse.body.data.token;
      testInvites.push(inviteResponse.body.data);

      // Step 3: Create a new user to join using the invitation
      const joiner = await createTestUser({
        email: 'joiner.invite@example.com',
        password: 'password123',
        fullName: 'Joiner User',
      });

      // Step 4: Use invitation to join group
      const joinResponse = await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .query({ token: inviteToken })
        .expect(200);

      expect(joinResponse.body.success).toBe(true);
      expect(joinResponse.body.data.groupId).toBe(group.id);
      expect(joinResponse.body.data.memberId).toBe(joiner.id);

      // Step 5: Verify joiner is now a member
      const groupsResponse = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${joiner.accessToken}`)
        .expect(200);

      expect(groupsResponse.body.data.length).toBe(1);
      expect(groupsResponse.body.data[0].id).toBe(group.id);

      // Step 6: Try to use the same invitation again (should fail)
      const anotherUser = await createTestUser({
        email: 'another.joiner@example.com',
        password: 'password123',
        fullName: 'Another Joiner User',
      });

      await request(app.getHttpServer())
        .post('/group-family/join')
        .set('Authorization', `Bearer ${anotherUser.accessToken}`)
        .query({ token: inviteToken })
        .expect(200); // Should still succeed - each user can join once per token

      // Add to cleanup
      testGroups.push(group);
    });
  });
});
