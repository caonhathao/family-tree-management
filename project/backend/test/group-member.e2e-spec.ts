import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * E2E Tests for Group Member Management Module
 *
 * Test Flow Description:
 * 1. User Authentication - Register and login users with different roles
 * 2. Group Creation - Create groups as foundation
 * 3. Group Member Management - Add users to groups with different roles
 * 4. Permission Control - Test @IsLeader decorator for group operations
 * 5. Business Logic - Test role management and leader changes
 *
 * Edge Cases Tested:
 * - @IsLeader decorator validation
 * - Role-based access control for group member operations
 * - Leader change functionality
 * - Member removal from group
 * - Permission violations (non-leaders trying to perform operations)
 */

describe('Group Member Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUsers: any[] = [];
  let testGroups: any[] = [];

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true, // Tự động chuyển đổi kiểu dữ liệu và áp dụng validation chặt chẽ hơn
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data in correct order
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

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((user) => user.email),
        },
      },
    });

    await app.close();
  });

  describe('1. SUCCESS CASES (200)', () => {
    let groupOwner: any;
    let memberUser: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'group.member.owner@example.com',
        password: 'password123',
        fullName: 'Group Member Owner',
      });

      memberUser = await createTestUser({
        email: 'group.member.user@example.com',
        password: 'password123',
        fullName: 'Group Member User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Group Member Test Group',
        description: 'Group for group member testing',
      });

      // Add member user as VIEWER initially
      await addUserToGroup(testGroup, memberUser, 'VIEWER');
    });

    it('should update group member role as LEADER', async () => {
      const updateData = {
        id: memberUser.id,
        role: 'EDITOR',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(updateData.role);
    });

    it('should change group leader successfully', async () => {
      const updateData = {
        id: memberUser.id,
        role: 'OWNER',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(updateData.role);
    });

    it('should remove member from group successfully', async () => {
      // Create a temporary member for removal test
      const tempMember = await createTestUser({
        email: 'temp.member@example.com',
        password: 'password123',
        fullName: 'Temp Member',
      });

      await addUserToGroup(testGroup, tempMember, 'VIEWER');

      const response = await request(app.getHttpServer())
        .delete(`/group-member/${testGroup.id}/${tempMember.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    let groupOwner: any;
    let memberUser: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'group.validation.owner@example.com',
        password: 'password123',
        fullName: 'Group Validation Owner',
      });

      memberUser = await createTestUser({
        email: 'group.validation.member@example.com',
        password: 'password123',
        fullName: 'Group Validation Member',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Group Validation Test Group',
        description: 'Group for validation testing',
      });

      await addUserToGroup(testGroup, memberUser, 'VIEWER');
    });

    it('should reject role update with missing member ID', async () => {
      const updateData = {
        role: 'EDITOR',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject role update with empty member ID', async () => {
      const updateData = {
        id: '',
        role: 'EDITOR',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject leader change with missing member ID', async () => {
      const updateData = {
        role: 'OWNER',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject leader change with empty member ID', async () => {
      const updateData = {
        id: '',
        role: 'OWNER',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject role update with empty payload', async () => {
      await request(app.getHttpServer())
        .patch(`/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      it('should reject role update without authentication', async () => {
        const updateData = {
          id: 'some-member-id',
          role: 'EDITOR',
        };

        await request(app.getHttpServer())
          .patch('/group-member/some-group-id')
          .send(updateData)
          .expect(401);
      });

      it('should reject leader change without authentication', async () => {
        const updateData = {
          id: 'some-member-id',
          role: 'OWNER',
        };

        await request(app.getHttpServer())
          .patch('/group-member/leader/some-group-id')
          .send(updateData)
          .expect(401);
      });

      it('should reject member removal without authentication', async () => {
        await request(app.getHttpServer())
          .delete('/group-member/some-group-id/some-member-id')
          .expect(401);
      });
    });

    describe('3.2 Permission Tests - @IsLeader decorator', () => {
      let groupOwner: any;
      let editorUser: any;
      let viewerUser: any;
      let nonMember: any;
      let testGroup: any;

      beforeAll(async () => {
        groupOwner = await createTestUser({
          email: 'role.group.owner@example.com',
          password: 'password123',
          fullName: 'Role Group Owner',
        });

        editorUser = await createTestUser({
          email: 'role.group.editor@example.com',
          password: 'password123',
          fullName: 'Role Group Editor',
        });

        viewerUser = await createTestUser({
          email: 'role.group.viewer@example.com',
          password: 'password123',
          fullName: 'Role Group Viewer',
        });

        nonMember = await createTestUser({
          email: 'role.group.nonmember@example.com',
          password: 'password123',
          fullName: 'Role Group Non Member',
        });

        // Create group
        testGroup = await createTestGroup(groupOwner, {
          name: 'Role Group Test Group',
          description: 'Group for role group testing',
        });

        // Add users to group with different roles
        await addUserToGroup(testGroup, editorUser, 'EDITOR');
        await addUserToGroup(testGroup, viewerUser, 'VIEWER');
      });

      it('should allow OWNER to update member role', async () => {
        const updateData = {
          id: editorUser.id,
          role: 'OWNER',
        };

        const response = await request(app.getHttpServer())
          .patch(`/group-member/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject EDITOR from updating member role (not leader)', async () => {
        const updateData = {
          id: viewerUser.id,
          role: 'EDITOR',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not leader
      });

      it('should reject VIEWER from updating member role (not leader)', async () => {
        const updateData = {
          id: viewerUser.id,
          role: 'EDITOR',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/${testGroup.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not leader
      });

      it('should reject non-member from updating member role', async () => {
        const updateData = {
          id: viewerUser.id,
          role: 'EDITOR',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not member
      });

      it('should allow OWNER to change group leader', async () => {
        const updateData = {
          id: editorUser.id,
          role: 'OWNER',
        };

        const response = await request(app.getHttpServer())
          .patch(`/group-member/leader/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject EDITOR from changing group leader (not current leader)', async () => {
        const updateData = {
          id: viewerUser.id,
          role: 'OWNER',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/leader/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not current leader
      });

      it('should reject VIEWER from changing group leader (not current leader)', async () => {
        const updateData = {
          id: editorUser.id,
          role: 'OWNER',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/leader/${testGroup.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not current leader
      });

      it('should reject non-member from changing group leader', async () => {
        const updateData = {
          id: editorUser.id,
          role: 'OWNER',
        };

        await request(app.getHttpServer())
          .patch(`/group-member/leader/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden - not member
      });

      it('should allow OWNER to remove member', async () => {
        // Create a temporary member for removal
        const tempMember = await createTestUser({
          email: 'temp.owner.member@example.com',
          password: 'password123',
          fullName: 'Temp Owner Member',
        });

        await addUserToGroup(testGroup, tempMember, 'VIEWER');

        const response = await request(app.getHttpServer())
          .delete(`/group-member/${testGroup.id}/${tempMember.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject EDITOR from removing member (not leader)', async () => {
        // Create a temporary member for removal test
        const tempMember = await createTestUser({
          email: 'temp.editor.member@example.com',
          password: 'password123',
          fullName: 'Temp Editor Member',
        });

        await addUserToGroup(testGroup, tempMember, 'VIEWER');

        await request(app.getHttpServer())
          .delete(`/group-member/${testGroup.id}/${tempMember.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .expect(403); // Forbidden - not leader
      });

      it('should reject VIEWER from removing member (not leader)', async () => {
        // Create a temporary member for removal test
        const tempMember = await createTestUser({
          email: 'temp.viewer.member@example.com',
          password: 'password123',
          fullName: 'Temp Viewer Member',
        });

        await addUserToGroup(testGroup, tempMember, 'VIEWER');

        await request(app.getHttpServer())
          .delete(`/group-member/${testGroup.id}/${tempMember.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .expect(403); // Forbidden - not leader
      });

      it('should reject non-member from removing member', async () => {
        // Create a temporary member for removal test
        const tempMember = await createTestUser({
          email: 'temp.nonmember@example.com',
          password: 'password123',
          fullName: 'Temp Non Member',
        });

        await addUserToGroup(testGroup, tempMember, 'VIEWER');

        await request(app.getHttpServer())
          .delete(`/group-member/${testGroup.id}/${tempMember.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .expect(403); // Forbidden - not member
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    let groupOwner: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'business.group@example.com',
        password: 'password123',
        fullName: 'Business Group User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Business Group Test Group',
        description: 'Group for business group testing',
      });
    });

    it('should return 404 when updating non-existent member', async () => {
      const updateData = {
        id: 'non-existent-member-id',
        role: 'EDITOR',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404); // Member not found
    });

    it('should return 404 when changing leader of non-existent member', async () => {
      const updateData = {
        id: 'non-existent-member-id',
        role: 'OWNER',
      };

      await request(app.getHttpServer())
        .patch(`/group-member/leader/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404); // Member not found
    });

    it('should return 404 when removing non-existent member', async () => {
      await request(app.getHttpServer())
        .delete(`/group-member/${testGroup.id}/non-existent-member-id`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(404); // Member not found
    });

    it('should return 404 when operations on non-existent group', async () => {
      const updateData = {
        id: 'some-member-id',
        role: 'EDITOR',
      };

      await request(app.getHttpServer())
        .patch('/group-member/non-existent-group-id')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404); // Group not found
    });

    it('should return 404 when removing member from non-existent group', async () => {
      await request(app.getHttpServer())
        .delete('/group-member/non-existent-group-id/some-member-id')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(404); // Group not found
    });
  });

  describe('5. INTEGRATION TESTS', () => {
    it('should complete full group member management flow: Create Group -> Add Member -> Update Role -> Change Leader -> Remove Member', async () => {
      // Step 1: Create group owner
      const owner = await createTestUser({
        email: 'integration.group@example.com',
        password: 'password123',
        fullName: 'Integration Group Owner',
      });

      // Step 2: Create group
      const group = await createTestGroup(owner, {
        name: 'Integration Group Test Group',
        description: 'Group for integration testing',
      });

      // Step 3: Create member user
      const member = await createTestUser({
        email: 'integration.group.member@example.com',
        password: 'password123',
        fullName: 'Integration Group Member',
      });

      // Step 4: Add member to group as VIEWER
      await addUserToGroup(group, member, 'VIEWER');

      // Step 5: Update member role to EDITOR
      const updateRoleData = {
        id: member.id,
        role: 'EDITOR',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/group-member/${group.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(updateRoleData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.role).toBe('EDITOR');

      // Step 6: Change leader to member (promote to OWNER)
      const changeLeaderData = {
        id: member.id,
        role: 'OWNER',
      };

      const leaderResponse = await request(app.getHttpServer())
        .patch(`/group-member/leader/${group.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(changeLeaderData)
        .expect(200);

      expect(leaderResponse.body.success).toBe(true);
      expect(leaderResponse.body.data.role).toBe('OWNER');

      // Step 7: New leader (member) can now perform leader operations
      const newTempMember = await createTestUser({
        email: 'integration.temp.member@example.com',
        password: 'password123',
        fullName: 'Integration Temp Member',
      });

      await addUserToGroup(group, newTempMember, 'VIEWER');

      const newLeaderUpdateData = {
        id: newTempMember.id,
        role: 'EDITOR',
      };

      const newLeaderResponse = await request(app.getHttpServer())
        .patch(`/group-member/${group.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send(newLeaderUpdateData)
        .expect(200);

      expect(newLeaderResponse.body.success).toBe(true);
      expect(newLeaderResponse.body.data.role).toBe('EDITOR');

      // Step 8: Remove temp member
      await request(app.getHttpServer())
        .delete(`/group-member/${group.id}/${newTempMember.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      // Add to cleanup
      testGroups.push(group);
    });
  });
});
