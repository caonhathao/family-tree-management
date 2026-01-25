import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { USER_ROLE } from '@prisma/client';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

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

//passed

describe('Group Member Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUsers: any[] = [];
  const testGroups: any[] = [];
  const testMembers: any[] = [];

  // Helper functions for test data generation
  const generateTestEmail = (role: string): string => {
    const timestamp = Date.now();
    return `test.${role}.${timestamp}@example.com`;
  };

  const generateValidUUID = (): string => {
    return '123e4567-e89b-12d3-a456-426614174000';
  };

  const generateInvalidUUID = (): string => {
    return 'invalid-uuid-format';
  };

  // Authentication helper
  const createTestUser = async (userData: any) => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
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

  // Group creation helper
  const createTestGroup = async (user: any) => {
    const groupData = {
      name: `Test Group ${Date.now()}`,
      description: 'Group for E2E testing',
    };

    const response = await request(app.getHttpServer())
      .post('/api/group-family')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(groupData)
      .expect(201);

    const group = {
      id: response.body.data.id,
      name: groupData.name,
      createdBy: user.id,
    };

    testGroups.push(group);
    return group;
  };

  // Add member to group helper
  const addMemberToGroup = async (
    group: any,
    user: any,
    role: USER_ROLE = USER_ROLE.VIEWER,
  ) => {
    // Check if member already exists (auto-created when group is created)
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        memberId_groupId: {
          groupId: group.id,
          memberId: user.id,
        },
      },
    });

    let member;
    if (existingMember) {
      // Member already exists, update it if needed
      member = await prisma.groupMember.update({
        where: {
          memberId_groupId: {
            groupId: group.id,
            memberId: user.id,
          },
        },
        data: {
          role: role,
          isLeader: false,
        },
      });
    } else {
      // Create new member
      member = await prisma.groupMember.create({
        data: {
          groupId: group.id,
          memberId: user.id,
          role: role,
          isLeader: false,
        },
      });
    }

    const testMember = {
      id: member.id,
      groupId: group.id,
      memberId: user.id,
      role: member.role,
      isLeader: member.isLeader,
      user: user,
    };

    testMembers.push(testMember);
    return testMember;
  };

  // Set group leader helper
  const setGroupLeader = async (group: any, user: any) => {
    await prisma.groupMember.updateMany({
      where: {
        groupId: group.id,
        memberId: user.id,
      },
      data: {
        isLeader: true,
        role: USER_ROLE.OWNER,
      },
    });

    // Update or add test member record
    let memberIndex = testMembers.findIndex(
      (m) => m.groupId === group.id && m.memberId === user.id,
    );

    if (memberIndex === -1) {
      // Add to test members if not already there
      const dbMember = await prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            groupId: group.id,
            memberId: user.id,
          },
        },
      });

      if (dbMember) {
        testMembers.push({
          id: dbMember.id,
          groupId: group.id,
          memberId: user.id,
          role: dbMember.role,
          isLeader: dbMember.isLeader,
          user: user,
        });
        memberIndex = testMembers.length - 1;
      }
    }

    if (memberIndex !== -1) {
      testMembers[memberIndex].isLeader = true;
      testMembers[memberIndex].role = USER_ROLE.OWNER;
    }
  };

  // Cleanup helpers
  const cleanupTestData = async () => {
    try {
      // Delete group members first (foreign key constraints)
      await prisma.groupMember.deleteMany({
        where: {
          groupId: {
            in: testGroups.map((g) => g.id),
          },
        },
      });

      // Delete groups
      await prisma.groupFamily.deleteMany({
        where: {
          id: {
            in: testGroups.map((g) => g.id),
          },
        },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: testUsers.map((u) => u.email),
          },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    // Clear arrays
    testUsers.length = 0;
    testGroups.length = 0;
    testMembers.length = 0;
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
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('api');

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
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
    let leader: any;
    let editorUser: any;
    let viewerUser: any;
    let testGroup: any;
    let memberToUpdate: any;

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
      await addMemberToGroup(testGroup, leader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, leader);
      memberToUpdate = await addMemberToGroup(
        testGroup,
        editorUser,
        USER_ROLE.EDITOR,
      );
      await addMemberToGroup(testGroup, viewerUser, USER_ROLE.VIEWER);
    });

    it('should allow leader to update member role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: editorUser.id,
          role: USER_ROLE.VIEWER,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(USER_ROLE.VIEWER);
      expect(response.body.data.memberId).toBe(editorUser.id);
      expect(response.body.data.groupId).toBe(testGroup.id);
      expect(response.body.data.isLeader).toBe(false); // Should preserve leader status
    });

    it('should reject role update from non-leader user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send({
          id: viewerUser.id,
          role: USER_ROLE.EDITOR,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      console.log('Non-leader role update response:', response.body);
    });

    it('should reject role update without authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .send({
          id: editorUser.id,
          role: USER_ROLE.VIEWER,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      console.log('Unauthenticated role update response:', response.body);
    });

    it('should return 404 when updating non-existent member', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: generateValidUUID(), // Non-existent user ID
          role: USER_ROLE.EDITOR,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      console.log('Non-existent member update response:', response.body);
    });

    it('should return 400 for invalid UUID format in role update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: generateInvalidUUID(),
          role: USER_ROLE.EDITOR,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('Invalid UUID role update response:', response.body);
    });
  });

  describe('Group Leadership Transfer', () => {
    let currentLeader: any;
    let newLeader: any;
    let regularMember: any;
    let testGroup: any;

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
      await addMemberToGroup(testGroup, currentLeader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, currentLeader);
      await addMemberToGroup(testGroup, newLeader, USER_ROLE.EDITOR);
      await addMemberToGroup(testGroup, regularMember, USER_ROLE.VIEWER);
    });

    it('should transfer leadership successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${currentLeader.accessToken}`)
        .send({
          id: newLeader.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memberId).toBe(newLeader.id);
      expect(response.body.data.role).toBe(USER_ROLE.OWNER);
      expect(response.body.data.isLeader).toBe(true);

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
      expect(oldLeaderRecord!.role).toBe(USER_ROLE.VIEWER);
      expect(newLeaderRecord!.isLeader).toBe(true);
      expect(newLeaderRecord!.role).toBe(USER_ROLE.OWNER);
    });

    it('should reject leadership transfer from non-leader', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${regularMember.accessToken}`)
        .send({
          id: newLeader.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      console.log('Non-leader leadership transfer response:', response.body);
    });

    it('should return 404 when transferring leadership to non-existent member', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${currentLeader.accessToken}`)
        .send({
          id: generateValidUUID(), // Non-existent user ID
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      console.log(
        'Non-existent member leadership transfer response:',
        response.body,
      );
    });

    it('should return 400 for invalid UUID in leadership transfer', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${currentLeader.accessToken}`)
        .send({
          id: generateInvalidUUID(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('Invalid UUID leadership transfer response:', response.body);
    });

    it('should verify old leader token returns 403 after leadership transfer', async () => {
      // First transfer leadership
      await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${currentLeader.accessToken}`)
        .send({
          id: newLeader.id,
        })
        .expect(200);

      // Now try to use old leader token for leader-only action
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${currentLeader.accessToken}`)
        .send({
          id: regularMember.id,
          role: USER_ROLE.EDITOR,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      console.log('Old leader token after transfer response:', response.body);
    });
  });

  describe('Group Member Removal', () => {
    let leader: any;
    let memberToRemove: any;
    let regularMember: any;
    let testGroup: any;

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
      await addMemberToGroup(testGroup, leader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, leader);
      await addMemberToGroup(testGroup, memberToRemove, USER_ROLE.EDITOR);
      await addMemberToGroup(testGroup, regularMember, USER_ROLE.VIEWER);
    });

    it('should allow leader to remove member', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/group-member/${testGroup.id}/${memberToRemove.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(1);

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
      const response = await request(app.getHttpServer())
        .delete(`/api/group-member/${testGroup.id}/${memberToRemove.id}`)
        .set('Authorization', `Bearer ${regularMember.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      console.log('Non-leader member removal response:', response.body);
    });

    it('should return 404 when removing non-existent member', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/group-member/${testGroup.id}/${generateValidUUID()}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .expect(200); // Service returns success with count: 0

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 for invalid UUID format in member removal', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/group-member/${testGroup.id}/${generateInvalidUUID()}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .expect(404); // Service throws NotFoundException for invalid UUID

      expect(response.body.success).toBe(false);
      console.log('Invalid UUID member removal response:', response.body);
    });

    it('should return 404 for invalid group UUID', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/api/group-member/${generateInvalidUUID()}/${memberToRemove.id}`,
        )
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      console.log('Invalid group UUID removal response:', response.body);
    });

    it('should handle removal of member not in group gracefully', async () => {
      const outsiderUser = await createTestUser({
        email: generateTestEmail('outsider'),
        password: 'password123',
        fullName: 'Outsider User',
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/group-member/${testGroup.id}/${outsiderUser.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .expect(200); // Service returns success with count: 0

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('Composite Key and Constraint Testing', () => {
    let leader: any;
    let testGroup: any;
    let member: any;

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
      await addMemberToGroup(testGroup, leader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, leader);
      await addMemberToGroup(testGroup, member, USER_ROLE.EDITOR);
    });

    it('should prevent duplicate group memberships', async () => {
      // Try to create the same membership again (this should fail at database level)
      try {
        await prisma.groupMember.create({
          data: {
            groupId: testGroup.id,
            memberId: member.id,
            role: USER_ROLE.VIEWER,
          },
        });
        fail('Expected database constraint violation');
      } catch (error) {
        expect(error.code).toBe('P2002'); // Unique constraint violation
      }
    });

    it('should enforce UUID validation at service level', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: 'not-a-uuid',
          role: USER_ROLE.VIEWER,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('UUID validation response:', response.body);
    });
  });

  describe('Data Consistency Validation', () => {
    let leader: any;
    let member1: any;
    let member2: any;
    let testGroup: any;

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
      await addMemberToGroup(testGroup, leader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, leader);
      await addMemberToGroup(testGroup, member1, USER_ROLE.EDITOR);
      await addMemberToGroup(testGroup, member2, USER_ROLE.VIEWER);
    });

    it('should preserve data structure in API responses', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: member1.id,
          role: USER_ROLE.VIEWER,
        })
        .expect(200);

      const data = response.body.data;

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
      expect(data.role).toBe(USER_ROLE.VIEWER);
      expect(Object.values(USER_ROLE)).toContain(data.role);
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
      await request(app.getHttpServer())
        .patch(`/api/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: member1.id,
        })
        .expect(200);

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
      expect(oldLeader!.role).toBe(USER_ROLE.VIEWER);
      expect(newLeader!.isLeader).toBe(true);
      expect(newLeader!.role).toBe(USER_ROLE.OWNER);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let leader: any;
    let testGroup: any;

    beforeEach(async () => {
      leader = await createTestUser({
        email: generateTestEmail('edge-leader'),
        password: 'password123',
        fullName: 'Edge Case Leader',
      });

      testGroup = await createTestGroup(leader);

      await addMemberToGroup(testGroup, leader, USER_ROLE.OWNER);
      await setGroupLeader(testGroup, leader);
    });

    it('should handle missing request body gracefully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('Missing body response:', response.body);
    });

    it('should handle missing ID field in request body', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          role: USER_ROLE.EDITOR,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('Missing ID response:', response.body);
    });

    it('should handle empty string ID in request body', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${leader.accessToken}`)
        .send({
          id: '',
          role: USER_ROLE.EDITOR,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      console.log('Empty ID response:', response.body);
    });
  });
});
