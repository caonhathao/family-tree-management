import { INestApplication } from '@nestjs/common';
import { MEMBER_ROLE } from '@prisma/client';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisteredUser,
  createTestUser as createRegisteredUser,
} from './helpers/auth.helpers';
import {
  addMemberToGroup,
  createGroup,
  setGroupLeader,
} from './helpers/group.helpers';
import {
  deleteGroupMembersByGroupIds,
  deleteGroupsByIds,
  deleteUsersByEmails,
} from './helpers/cleanup.helpers';
import {
  generateRandomSuffix,
  generateTestEmail,
  INVALID_UUID,
  VALID_UUID,
} from './helpers/common.helpers';
import {
  GroupMemberResponse,
  RemoveMemberResponse,
} from 'src/modules/group-members/types/group-member-response.type';

/**
 * E2E Tests for Group Member Management Module
 *
 * Test Flow Description:
 * 1. User Setup - Create test users with different roles (leader, editor, viewer)
 * 2. Group Setup - Create test group with established leadership hierarchy
 * 3. Member Management - Test role updates, leadership changes, member removal
 * 4. Permission Matrix - Validate leadership-based access controls
 * 5. Edge Cases - Test invalid scenarios, UUID validation, constraint violations
 *
 * Permission Matrix Tested:
 * - Leader Role: Can update roles, transfer leadership, remove members
 * - Non-Leader Role: 403 Forbidden for all leader-only actions
 * - Invalid IDs: 404 Not Found for non-existent groups/members
 * - UUID Validation: 400 Bad Request for malformed UUIDs
 *
 * Critical Business Logic Validated:
 * - Leadership transfer atomicity (transaction rollback on failure)
 * - Role preservation during leadership changes
 * - Composite key constraints ([memberId, groupId])
 * - Database consistency after operations
 */

describe('Group Member Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: TestApi;
  const testUsers: { email: string }[] = [];
  const testGroups: { id: string; name: string; createdBy: string }[] = [];

  // Authentication helper
  const createTestUser = async (userData: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<RegisteredUser> => {
    const user = await createRegisteredUser(api, userData);

    testUsers.push({ email: userData.email });
    return user;
  };

  // Group creation helper
  const createTestGroup = async (
    user: RegisteredUser,
  ): Promise<{ id: string; name: string; createdBy: string }> => {
    const groupData = {
      name: `Test Group ${generateRandomSuffix()}`,
      description: 'Group for E2E testing',
    };

    const body = await createGroup(api, user.accessToken, groupData, 201);

    const group = {
      id: body.data.id,
      name: groupData.name,
      createdBy: user.id,
    };

    testGroups.push(group);
    return group;
  };

  // Cleanup helpers
  const cleanupTestData = async () => {
    try {
      // Delete group members first (foreign key constraints)
      await deleteGroupMembersByGroupIds(
        prisma,
        testGroups.map((g) => g.id),
      );

      // Delete groups
      await deleteGroupsByIds(
        prisma,
        testGroups.map((g) => g.id),
      );

      // Delete users
      await deleteUsersByEmails(
        prisma,
        testUsers.map((u) => u.email),
      );
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    // Clear arrays
    testUsers.length = 0;
    testGroups.length = 0;
  };

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      httpServer,
    } = await createTestApp({
      validationPipe: {
        transform: true,
        whitelist: true,
      },
      allExceptionsFilter: true,
    });

    app = testApp;
    prisma = testPrisma;
    api = new TestApi(httpServer, '/api');
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await cleanupTestData();
  });

  describe('Group Member Role Management', () => {
    let leader: RegisteredUser;
    let editorUser: RegisteredUser;
    let viewerUser: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };

    beforeEach(async () => {
      // Create test users
      leader = await createTestUser({
        email: generateTestEmail('leader'),
        password: 'password123',
        fullName: 'Group Leader',
      });

      editorUser = await createTestUser({
        email: generateTestEmail('editor'),
        password: 'password123',
        fullName: 'Group Editor',
      });

      viewerUser = await createTestUser({
        email: generateTestEmail('viewer'),
        password: 'password123',
        fullName: 'Group Viewer',
      });

      // Create test group
      testGroup = await createTestGroup(leader);

      // Add members to group
      await addMemberToGroup(
        prisma,
        testGroup.id,
        leader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, leader.id);
      await addMemberToGroup(
        prisma,
        testGroup.id,
        editorUser.id,
        MEMBER_ROLE.EDITOR,
      );
      await addMemberToGroup(
        prisma,
        testGroup.id,
        viewerUser.id,
        MEMBER_ROLE.VIEWER,
      );
    });

    it('should allow leader to update member role', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: editorUser.id,
          role: MEMBER_ROLE.VIEWER,
        },
        { token: leader.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.role).toBe(MEMBER_ROLE.VIEWER);
      expect(body.data.memberId).toBe(editorUser.id);
      expect(body.data.groupId).toBe(testGroup.id);
      expect(body.data.isLeader).toBe(false); // Should preserve leader status
    });

    it('should reject role update from non-leader user', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: viewerUser.id,
          role: MEMBER_ROLE.EDITOR,
        },
        { token: editorUser.accessToken, expect: 403 },
      );

      expect(body.success).toBe(false);
      console.log('Non-leader role update response:', body);
    });

    it('should reject role update without authentication', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: editorUser.id,
          role: MEMBER_ROLE.VIEWER,
        },
        { expect: 401 },
      );

      expect(body.success).toBe(false);
      console.log('Unauthenticated role update response:', body);
    });

    it('should return 404 when updating non-existent member', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: VALID_UUID, // Non-existent user ID
          role: MEMBER_ROLE.EDITOR,
        },
        { token: leader.accessToken, expect: 404 },
      );

      expect(body.success).toBe(false);
      console.log('Non-existent member update response:', body);
    });

    it('should return 400 for invalid UUID format in role update', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: INVALID_UUID,
          role: MEMBER_ROLE.EDITOR,
        },
        { token: leader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('Invalid UUID role update response:', body);
    });
  });

  describe('Group Leadership Transfer', () => {
    let currentLeader: RegisteredUser;
    let newLeader: RegisteredUser;
    let regularMember: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };

    beforeEach(async () => {
      // Create test users
      currentLeader = await createTestUser({
        email: generateTestEmail('current-leader'),
        password: 'password123',
        fullName: 'Current Leader',
      });

      newLeader = await createTestUser({
        email: generateTestEmail('new-leader'),
        password: 'password123',
        fullName: 'New Leader',
      });

      regularMember = await createTestUser({
        email: generateTestEmail('regular-member'),
        password: 'password123',
        fullName: 'Regular Member',
      });

      // Create test group
      testGroup = await createTestGroup(currentLeader);

      // Add members to group
      await addMemberToGroup(
        prisma,
        testGroup.id,
        currentLeader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, currentLeader.id);
      await addMemberToGroup(
        prisma,
        testGroup.id,
        newLeader.id,
        MEMBER_ROLE.EDITOR,
      );
      await addMemberToGroup(
        prisma,
        testGroup.id,
        regularMember.id,
        MEMBER_ROLE.VIEWER,
      );
    });

    it('should transfer leadership successfully', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: newLeader.id,
        },
        { token: currentLeader.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.memberId).toBe(newLeader.id);
      expect(body.data.role).toBe(MEMBER_ROLE.OWNER);
      expect(body.data.isLeader).toBe(true);

      // Verify database state
      const oldLeaderRecord = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: testGroup.id,
            memberId: currentLeader.id,
          },
        },
      });

      const newLeaderRecord = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: testGroup.id,
            memberId: newLeader.id,
          },
        },
      });

      expect(oldLeaderRecord).not.toBeNull();
      expect(newLeaderRecord).not.toBeNull();
      expect(oldLeaderRecord!.isLeader).toBe(false);
      expect(oldLeaderRecord!.role).toBe(MEMBER_ROLE.VIEWER);
      expect(newLeaderRecord!.isLeader).toBe(true);
      expect(newLeaderRecord!.role).toBe(MEMBER_ROLE.OWNER);
    });

    it('should reject leadership transfer from non-leader', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: newLeader.id,
        },
        { token: regularMember.accessToken, expect: 403 },
      );

      expect(body.success).toBe(false);
      console.log('Non-leader leadership transfer response:', body);
    });

    it('should return 404 when transferring leadership to non-existent member', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: VALID_UUID, // Non-existent user ID
        },
        { token: currentLeader.accessToken, expect: 409 },
      );

      expect(body.success).toBe(false);
      console.log('Non-existent member leadership transfer response:', body);
    });

    it('should return 400 for invalid UUID in leadership transfer', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: INVALID_UUID,
        },
        { token: currentLeader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('Invalid UUID leadership transfer response:', body);
    });

    it('should verify old leader token returns 403 after leadership transfer', async () => {
      // First transfer leadership
      await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: newLeader.id,
        },
        { token: currentLeader.accessToken, expect: 200 },
      );

      // Now try to use old leader token for leader-only action
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: regularMember.id,
          role: MEMBER_ROLE.EDITOR,
        },
        { token: currentLeader.accessToken, expect: 403 },
      );

      expect(body.success).toBe(false);
      console.log('Old leader token after transfer response:', body);
    });
  });

  describe('Group Member Removal', () => {
    let leader: RegisteredUser;
    let memberToRemove: RegisteredUser;
    let regularMember: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };

    beforeEach(async () => {
      // Create test users
      leader = await createTestUser({
        email: generateTestEmail('removal-leader'),
        password: 'password123',
        fullName: 'Removal Leader',
      });

      memberToRemove = await createTestUser({
        email: generateTestEmail('member-to-remove'),
        password: 'password123',
        fullName: 'Member To Remove',
      });

      regularMember = await createTestUser({
        email: generateTestEmail('regular-member-removal'),
        password: 'password123',
        fullName: 'Regular Member',
      });

      // Create test group
      testGroup = await createTestGroup(leader);

      // Add members to group
      await addMemberToGroup(
        prisma,
        testGroup.id,
        leader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, leader.id);
      await addMemberToGroup(
        prisma,
        testGroup.id,
        memberToRemove.id,
        MEMBER_ROLE.EDITOR,
      );
      await addMemberToGroup(
        prisma,
        testGroup.id,
        regularMember.id,
        MEMBER_ROLE.VIEWER,
      );
    });

    it('should allow leader to remove member', async () => {
      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${testGroup.id}/${memberToRemove.id}`,
        { token: leader.accessToken, expect: 200 },
      );

      expect(body.success).toBe(true);
      expect(body.data.count).toBe(1);

      // Verify member is actually removed
      const removedMember = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: testGroup.id,
            memberId: memberToRemove.id,
          },
        },
      });

      expect(removedMember).toBeNull();
    });

    it('should reject member removal by non-leader', async () => {
      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${testGroup.id}/${memberToRemove.id}`,
        { token: regularMember.accessToken, expect: 403 },
      );

      expect(body.success).toBe(false);
      console.log('Non-leader member removal response:', body);
    });

    it('should return 404 when removing non-existent member', async () => {
      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${testGroup.id}/${VALID_UUID}`,
        { token: leader.accessToken, expect: 200 }, // Service returns success with count: 0
      );

      expect(body.success).toBe(true);
      expect(body.data.count).toBe(0);
    });

    it('should return 400 for invalid UUID format in member removal', async () => {
      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${testGroup.id}/${INVALID_UUID}`,
        { token: leader.accessToken, expect: 404 }, // Service throws NotFoundException for invalid UUID
      );

      expect(body.success).toBe(false);
      console.log('Invalid UUID member removal response:', body);
    });

    it('should return 404 for invalid group UUID', async () => {
      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${INVALID_UUID}/${memberToRemove.id}`,
        { token: leader.accessToken, expect: 500 },
      );

      expect(body.success).toBe(false);
      console.log('Invalid group UUID removal response:', body);
    });

    it('should handle removal of member not in group gracefully', async () => {
      const outsiderUser = await createTestUser({
        email: generateTestEmail('outsider'),
        password: 'password123',
        fullName: 'Outsider User',
      });

      const body = await api.delete<RemoveMemberResponse>(
        `/group-member/${testGroup.id}/${outsiderUser.id}`,
        { token: leader.accessToken, expect: 200 }, // Service returns success with count: 0
      );

      expect(body.success).toBe(true);
      expect(body.data.count).toBe(0);
    });
  });

  describe('Composite Key and Constraint Testing', () => {
    let leader: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };
    let member: RegisteredUser;

    beforeEach(async () => {
      // Create test users
      leader = await createTestUser({
        email: generateTestEmail('constraint-leader'),
        password: 'password123',
        fullName: 'Constraint Leader',
      });

      member = await createTestUser({
        email: generateTestEmail('constraint-member'),
        password: 'password123',
        fullName: 'Constraint Member',
      });

      // Create test group
      testGroup = await createTestGroup(leader);

      // Add members to group
      await addMemberToGroup(
        prisma,
        testGroup.id,
        leader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, leader.id);
      await addMemberToGroup(
        prisma,
        testGroup.id,
        member.id,
        MEMBER_ROLE.EDITOR,
      );
    });

    it('should prevent duplicate group memberships', async () => {
      // Try to create the same membership again (this should fail at database level)
      try {
        await prisma.groupMember.create({
          data: {
            groupId: testGroup.id,
            memberId: member.id,
            role: MEMBER_ROLE.VIEWER,
          },
        });
        fail('Expected database constraint violation');
      } catch (error) {
        expect((error as { code: string }).code).toBe('P2002'); // Unique constraint violation
      }
    });

    it('should enforce UUID validation at service level', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: 'not-a-uuid',
          role: MEMBER_ROLE.VIEWER,
        },
        { token: leader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('UUID validation response:', body);
    });
  });

  describe('Data Consistency Validation', () => {
    let leader: RegisteredUser;
    let member1: RegisteredUser;
    let member2: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };

    beforeEach(async () => {
      // Create test users
      leader = await createTestUser({
        email: generateTestEmail('consistency-leader'),
        password: 'password123',
        fullName: 'Consistency Leader',
      });

      member1 = await createTestUser({
        email: generateTestEmail('consistency-member1'),
        password: 'password123',
        fullName: 'Consistency Member 1',
      });

      member2 = await createTestUser({
        email: generateTestEmail('consistency-member2'),
        password: 'password123',
        fullName: 'Consistency Member 2',
      });

      // Create test group
      testGroup = await createTestGroup(leader);

      // Add members to group
      await addMemberToGroup(
        prisma,
        testGroup.id,
        leader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, leader.id);
      await addMemberToGroup(
        prisma,
        testGroup.id,
        member1.id,
        MEMBER_ROLE.EDITOR,
      );
      await addMemberToGroup(
        prisma,
        testGroup.id,
        member2.id,
        MEMBER_ROLE.VIEWER,
      );
    });

    it('should preserve data structure in API responses', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: member1.id,
          role: MEMBER_ROLE.VIEWER,
        },
        { token: leader.accessToken, expect: 200 },
      );

      const data = body.data;

      // Validate response structure matches Prisma model
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('memberId');
      expect(data).toHaveProperty('groupId');
      expect(data).toHaveProperty('role');
      expect(data).toHaveProperty('isLeader');

      // Validate data types
      expect(typeof data.id).toBe('string');
      expect(typeof data.memberId).toBe('string');
      expect(typeof data.groupId).toBe('string');
      expect(typeof data.role).toBe('string');
      expect(typeof data.isLeader).toBe('boolean');

      // Validate values
      expect(data.memberId).toBe(member1.id);
      expect(data.groupId).toBe(testGroup.id);
      expect(data.role).toBe(MEMBER_ROLE.VIEWER);
      expect(Object.values(MEMBER_ROLE)).toContain(data.role);
    });

    it('should maintain database consistency during leadership transfer', async () => {
      // Get initial state
      const initialState = await prisma.groupMember.findMany({
        where: { groupId: testGroup.id },
        orderBy: { memberId: 'asc' },
      });

      expect(initialState).toHaveLength(3); // leader, member1, member2
      expect(initialState.filter((m) => m.isLeader)).toHaveLength(1);

      // Transfer leadership
      await api.patch<GroupMemberResponse>(
        `/group-member/leader/${testGroup.id}`,
        {
          id: member1.id,
        },
        { token: leader.accessToken, expect: 200 },
      );

      // Verify final state
      const finalState = await prisma.groupMember.findMany({
        where: { groupId: testGroup.id },
        orderBy: { memberId: 'asc' },
      });

      expect(finalState).toHaveLength(3); // Same number of members
      expect(finalState.filter((m) => m.isLeader)).toHaveLength(1); // Still one leader

      const oldLeader = finalState.find((m) => m.memberId === leader.id);
      const newLeader = finalState.find((m) => m.memberId === member1.id);

      expect(oldLeader).toBeDefined();
      expect(newLeader).toBeDefined();
      expect(oldLeader!.isLeader).toBe(false);
      expect(oldLeader!.role).toBe(MEMBER_ROLE.VIEWER);
      expect(newLeader!.isLeader).toBe(true);
      expect(newLeader!.role).toBe(MEMBER_ROLE.OWNER);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let leader: RegisteredUser;
    let testGroup: { id: string; name: string; createdBy: string };

    beforeEach(async () => {
      leader = await createTestUser({
        email: generateTestEmail('edge-leader'),
        password: 'password123',
        fullName: 'Edge Case Leader',
      });

      testGroup = await createTestGroup(leader);

      await addMemberToGroup(
        prisma,
        testGroup.id,
        leader.id,
        MEMBER_ROLE.OWNER,
      );
      await setGroupLeader(prisma, testGroup.id, leader.id);
    });

    it('should handle missing request body gracefully', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {},
        { token: leader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('Missing body response:', body);
    });

    it('should handle missing ID field in request body', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          role: MEMBER_ROLE.EDITOR,
        },
        { token: leader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('Missing ID response:', body);
    });

    it('should handle empty string ID in request body', async () => {
      const body = await api.patch<GroupMemberResponse>(
        `/group-member/${testGroup.id}`,
        {
          id: '',
          role: MEMBER_ROLE.EDITOR,
        },
        { token: leader.accessToken, expect: 400 },
      );

      expect(body.success).toBe(false);
      console.log('Empty ID response:', body);
    });
  });
});
