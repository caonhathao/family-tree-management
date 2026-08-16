import { INestApplication } from '@nestjs/common';
import { MEMBER_ROLE } from '@prisma/client';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisteredUser,
  createTestUser as createRegisteredUser,
} from './helpers/auth.helpers';
import { createGroup, joinGroup } from './helpers/group.helpers';
import {
  deleteGroupMembersByGroupIds,
  deleteGroupsByIds,
  deleteInvitesByTokens,
  deleteUsersByEmails,
} from './helpers/cleanup.helpers';
import { ApiDataResponse } from 'src/common/constants/api';
import {
  GroupData,
  GroupDetail,
  GroupListEntry,
  GroupResponse,
} from 'src/modules/group-family/types/group-family-response.type';

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
  let api: TestApi;

  // Test data storage for cleanup
  const testUsers: { email: string }[] = [];
  const testGroups: GroupData[] = [];
  const testInvites: { token: string }[] = [];

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      httpServer,
    } = await createTestApp();

    app = testApp;
    prisma = testPrisma;
    api = new TestApi(httpServer, '/api');
  });

  afterAll(async () => {
    // Final cleanup of users
    if (testUsers.length > 0) {
      await deleteUsersByEmails(
        prisma,
        testUsers.map((user) => user.email),
      );
    }

    await app.close();
  });

  afterEach(async () => {
    // Clean up test data after each test to avoid P2002 unique constraint errors
    if (testGroups.length > 0) {
      await deleteGroupMembersByGroupIds(
        prisma,
        testGroups.map((group) => group.id),
      );

      await deleteGroupsByIds(
        prisma,
        testGroups.map((group) => group.id),
      );
    }

    if (testInvites.length > 0) {
      await deleteInvitesByTokens(
        prisma,
        testInvites.map((invite) => invite.token),
      );
    }

    // Clear arrays
    testGroups.length = 0;
    testInvites.length = 0;
  });

  // Helper functions
  const createTestUser = async (userData: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<RegisteredUser> => {
    const user = await createRegisteredUser(api, userData);

    testUsers.push({ email: userData.email });
    return user;
  };

  const createTestGroup = async (
    leaderToken: string,
    groupData: { name: string; description?: string },
  ): Promise<GroupData> => {
    const body = await createGroup(api, leaderToken, groupData, 201);

    testGroups.push(body.data);
    return body.data;
  };

  describe('1. GROUP CREATION (POST /api/group-family)', () => {
    it('should create group family successfully with leader privileges', async () => {
      const leaderData = {
        email: `leader.group.create${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Group Leader Test',
      };

      const leader = await createTestUser(leaderData);
      const groupData = {
        name: 'Test Group Family',
        description: 'A test group for E2E testing',
      };

      const body = await createGroup(api, leader.accessToken, groupData, 201);

      expect(body.success).toBe(true);
      expect(body.data.name).toBe(groupData.name);
      expect(body.data.description).toBe(groupData.description);

      // Verify leader was added to group in database
      const groupMember = await prisma.groupMember.findFirst({
        where: {
          groupId: body.data.id,
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
        expect(groupMember.role).toBe(MEMBER_ROLE.OWNER);
        expect(groupMember.isLeader).toBe(true);
      }
    });

    it('should reject group creation without authentication', async () => {
      const groupData = {
        name: 'Unauthorized Group',
        description: 'Should not be created',
      };

      await api.post('/group-family', groupData, { expect: 401 });
    });

    it('should reject group creation with invalid name (too short)', async () => {
      const userData = {
        email: `invalid.name${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Invalid Name User',
      };

      const user = await createTestUser(userData);
      const groupData = {
        name: 'abc', // Too short (minimum 6)
        description: 'Should fail validation',
      };

      await createGroup(api, user.accessToken, groupData, 400);
    });

    it('should reject group creation with invalid name (too long)', async () => {
      const userData = {
        email: `long.name${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Long Name User',
      };

      const user = await createTestUser(userData);
      const groupData = {
        name: 'a'.repeat(31), // Too long (maximum 30)
        description: 'Should fail validation',
      };

      await createGroup(api, user.accessToken, groupData, 400);
    });

    it('should create group without optional description', async () => {
      const userData = {
        email: `no.desc${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'No Description User',
      };

      const user = await createTestUser(userData);
      const groupData = {
        name: 'Group Without Description',
      };

      const body = await createGroup(api, user.accessToken, groupData, 201);

      expect(body.data.description).toBeNull();
    });
  });

  describe('2. GROUP RETRIEVAL (GET /api/group-family)', () => {
    let leaderToken: string;
    let memberToken: string;
    let testGroup: GroupData;

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

      const leader = await createTestUser(leaderData);
      const member = await createTestUser(memberData);

      leaderToken = leader.accessToken;
      memberToken = member.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Retrieve Test Group',
        description: 'Group for testing retrieval',
      });

      // Add member to group
      const invite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leader.id,
          token: `test-invite-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      testInvites.push(invite);

      await joinGroup(api, memberToken, invite.token, 200);
    });

    it('should get all groups for authenticated user', async () => {
      const body = await api.get<ApiDataResponse<GroupListEntry[]>>(
        '/group-family',
        { token: leaderToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);

      const foundGroup = body.data.find((group) => group.id === testGroup.id);
      expect(foundGroup).toBeDefined();
      expect(foundGroup?.name).toBe(testGroup.name);
    });

    it('should get specific group by ID for member', async () => {
      const body = await api.get<ApiDataResponse<GroupDetail>>(
        `/group-family/${testGroup.id}`,
        { token: leaderToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testGroup.id);
      expect(body.data.name).toBe(testGroup.name);
      expect(body.data.description).toBe(testGroup.description);
      expect(body.data.groupMembers).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('should reject getting group for non-member', async () => {
      const nonMemberData = {
        email: `nonmember${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Non Member User',
      };

      const user = await createTestUser(nonMemberData);

      await api.get(`/group-family/${testGroup.id}`, {
        token: user.accessToken,
        expect: 404,
      });
    });

    it('should reject getting group with invalid UUID', async () => {
      await api.get('/group-family/invalid-uuid', {
        token: leaderToken,
        expect: 404,
      });
    });

    it('should reject getting groups without authentication', async () => {
      await api.get('/group-family', { expect: 401 });
    });
  });

  describe('3. GROUP UPDATE (PATCH /api/group-family/:id)', () => {
    let leaderToken: string;
    let memberToken: string;
    let testGroup: GroupData;

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

      const leader = await createTestUser(leaderData);
      const member = await createTestUser(memberData);

      leaderToken = leader.accessToken;
      memberToken = member.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Update Test Group',
        description: 'Original description',
      });

      // Add non-leader member to test permissions
      const invite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leader.id,
          token: `test-invite-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      testInvites.push(invite);

      await joinGroup(api, memberToken, invite.token, 200);
    });

    it('should allow leader to update group', async () => {
      const updateData = {
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const body = await api.patch<GroupResponse>(
        `/group-family/${testGroup.id}`,
        updateData,
        { token: leaderToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.name).toBe(updateData.name);
      expect(body.data.description).toBe(updateData.description);
    });

    it('should reject group update by non-leader member', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      await api.patch(`/group-family/${testGroup.id}`, updateData, {
        token: memberToken,
        expect: 404, // Service returns 404 for non-leader
      });
    });

    it('should reject group update with empty name', async () => {
      await api.patch(
        `/group-family/${testGroup.id}`,
        { name: '' },
        { token: leaderToken, expect: 400 },
      );
    });

    it('should reject group update for non-existent group', async () => {
      const updateData = {
        name: 'Non-existent Group',
      };

      await api.patch(
        '/group-family/00000000-0000-0000-0000-000000000000',
        updateData,
        {
          token: leaderToken,
          expect: 404,
        },
      );
    });
  });

  describe('4. GROUP JOIN (POST /api/group-family/join)', () => {
    let leaderToken: string;
    let testGroup: GroupData;
    let validInvite: { token: string };

    beforeEach(async () => {
      const leaderData = {
        email: `leader.join${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Join Leader',
      };

      const leader = await createTestUser(leaderData);
      leaderToken = leader.accessToken;

      testGroup = await createTestGroup(leaderToken, {
        name: 'Join Test Group',
        description: 'Group for testing join functionality',
      });

      validInvite = await prisma.invite.create({
        data: {
          groupId: testGroup.id,
          senderId: leader.id,
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

      const user = await createTestUser(userData);

      const body = await joinGroup(
        api,
        user.accessToken,
        validInvite.token,
        200,
      );

      expect(body.success).toBe(true);
      expect(body.data.groupId).toBe(testGroup.id);
      expect(body.data.memberId).toBeDefined();
      expect(body.data.role).toBe(MEMBER_ROLE.VIEWER);
      expect(body.data.isLeader).toBe(false);

      // Verify membership in database
      const membership = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: testGroup.id,
            memberId: body.data.memberId,
          },
        },
      });

      expect(membership).toBeDefined();
      if (membership) {
        expect(membership.role).toBe(MEMBER_ROLE.VIEWER);
        expect(membership.isLeader).toBe(false);
      }
    });

    it('should reject joining with invalid token', async () => {
      const userData = {
        email: `invalid.token${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Invalid Token User',
      };

      const user = await createTestUser(userData);

      await joinGroup(api, user.accessToken, 'invalid-token-123', 404);
    });

    it('should reject joining without authentication', async () => {
      await api.post('/group-family/join', undefined, {
        query: { token: validInvite.token },
        expect: 401,
      });
    });
  });

  describe('5. isLeader FIELD VERIFICATION', () => {
    it('should handle isLeader field correctly during group creation', async () => {
      const leaderData = {
        email: `leader.check${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Leader Check User',
      };

      const leader = await createTestUser(leaderData);

      const body = await createGroup(
        api,
        leader.accessToken,
        { name: 'Leader Check Group' },
        201,
      );

      const groupId = body.data.id;

      // Verify actual database state
      const membership = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: groupId,
            memberId: leader.id,
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

      const user = await createTestUser(userData);

      await api.post('/group-family', '{"invalid": json}', {
        token: user.accessToken,
        headers: { 'Content-Type': 'application/json' },
        expect: 400,
      });
    });

    it('should add debug logging for 400/500 errors', async () => {
      const userData = {
        email: `debug.user${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Debug User',
      };

      const user = await createTestUser(userData);

      const body = await createGroup(
        api,
        user.accessToken,
        { name: 'abc' }, // Invalid - too short
        400,
      );

      // Console log the response body for debugging
      console.log('400 Error Response:', body);
      expect(body).toBeDefined();
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

      const leader = await createTestUser(leaderData);

      // Create group
      const groupBody = await createGroup(
        api,
        leader.accessToken,
        {
          name: 'Lifecycle Test Group',
          description: 'Testing complete lifecycle',
        },
        201,
      );

      const groupId = groupBody.data.id;

      // Create invite
      const invite = await prisma.invite.create({
        data: {
          groupId: groupId,
          senderId: leader.id,
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

      const member = await createTestUser(memberData);

      // Member joins group
      await joinGroup(api, member.accessToken, invite.token, 200);

      // Leader updates group
      await api.patch<GroupResponse>(
        `/group-family/${groupId}`,
        {
          name: 'Updated Lifecycle Group',
          description: 'Updated description',
        },
        { token: leader.accessToken, expect: 200 },
      );

      // Verify final state
      const finalGroup = await api.get<ApiDataResponse<GroupDetail>>(
        `/group-family/${groupId}`,
        { token: leader.accessToken, expect: 200 },
      );

      expect(finalGroup.data.name).toBe('Updated Lifecycle Group');
      expect(finalGroup.data.description).toBe('Updated description');
      expect(finalGroup.data.groupMembers).toBeDefined();
      expect(finalGroup.data.groupMembers.length).toBe(2); // Leader + Member
    });
  });
});
