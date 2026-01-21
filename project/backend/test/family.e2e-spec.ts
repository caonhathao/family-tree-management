import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

// Type for supertest response
interface TestResponse<T = any> {
  body: {
    data: T;
    success: boolean;
  };
  status: number;
}

// Type for supertest response
interface TestResponse<T = any> {
  body: {
    data: T;
    success: boolean;
  };
  status: number;
}

/**
 * E2E Tests for Family Management Module
 *
 * Test Flow Description:
 * 1. User Authentication - Register and login users with different roles
 * 2. Group Membership Setup - Add users to groups with proper roles
 * 3. Family Creation - Create families within groups (one per group)
 * 4. Family Management - Update, get, delete families
 * 5. Permission Control - Test role-based access (OWNER/EDITOR/VIEWER)
 * 6. Business Logic - Test one-family-per-group rule
 *
 * Edge Cases Tested:
 * - Role-based access control for family operations
 * - Family creation validation
 * - Permission violations (wrong roles trying to access/modify)
 * - Database constraints (one family per group)
 * - Family ownership verification
 */

describe('Family Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUsers: any[] = [];
  const testGroups: any[] = [];
  const testFamilies: any[] = [];

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

    const group = {
      id: response.body.data.id,
      name: response.body.data.name,
      description: response.body.data.description,
      ownerId: user.id,
    };

    testGroups.push(group);
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
    await prisma.relationship.deleteMany({
      where: {
        familyId: {
          in: testFamilies.map((family: any) => family.id),
        },
      },
    });

    await prisma.familyMember.deleteMany({
      where: {
        familyId: {
          in: testFamilies.map((family: any) => family.id),
        },
      },
    });

    await prisma.family.deleteMany({
      where: {
        id: {
          in: testFamilies.map((family: any) => family.id),
        },
      },
    });

    await prisma.groupMember.deleteMany({
      where: {
        groupId: {
          in: testGroups.map((group: any) => group.id),
        },
      },
    });

    await prisma.groupFamily.deleteMany({
      where: {
        id: {
          in: testGroups.map((group: any) => group.id),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((user: any) => user.email),
        },
      },
    });

    await app.close();
  });

  describe('1. SUCCESS CASES (200 / 201)', () => {
    let groupOwner: any;
    let editorUser: any;
    let viewerUser: any;
    let testGroup: any;
    let createdFamily: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'family.owner@example.com',
        password: 'password123',
        fullName: 'Family Owner User',
      });

      editorUser = await createTestUser({
        email: 'family.editor@example.com',
        password: 'password123',
        fullName: 'Family Editor User',
      });

      viewerUser = await createTestUser({
        email: 'family.viewer@example.com',
        password: 'password123',
        fullName: 'Family Viewer User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Family Test Group',
        description: 'Group for family testing',
      });

      // Add users to group with proper roles
      await addUserToGroup(testGroup, editorUser, 'EDITOR');
      await addUserToGroup(testGroup, viewerUser, 'VIEWER');
    });

    it('should create a new family successfully as OWNER', async () => {
      const familyData = {
        name: 'Johnson Family',
        description: 'The Johnson family lineage',
      };

      const response = await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.family.name).toBe(familyData.name);
      expect(response.body.data.family.description).toBe(
        familyData.description,
      );
      expect(response.body.data.owner.name).toBe(groupOwner.fullName);

      createdFamily = response.body.data.family;
      testFamilies.push(createdFamily);
    });

    it('should create a new family successfully as EDITOR', async () => {
      const familyData = {
        name: 'Editor Family',
        description: 'Family created by editor',
      };

      const response = await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(familyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.family.name).toBe(familyData.name);
      expect(response.body.data.family.description).toBe(
        familyData.description,
      );

      testFamilies.push(response.body.data.family);
    });

    it('should get family by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/family/${createdFamily.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdFamily.id);
      expect(response.body.data.name).toBe(createdFamily.name);
      expect(response.body.data.description).toBe(createdFamily.description);
      expect(response.body.data.owner).toBeDefined();
      expect(response.body.data._count).toBeDefined();
      expect(response.body.data._count.familyMembers).toBeDefined();
      expect(response.body.data._count.albums).toBeDefined();
      expect(response.body.data._count.events).toBeDefined();
    });

    it('should update family successfully as OWNER', async () => {
      const updateData = {
        id: createdFamily.id,
        name: 'Updated Johnson Family',
        description: 'Updated family description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should update family successfully as EDITOR', async () => {
      // Create another family for update test
      const familyData = {
        name: 'Update Test Family',
        description: 'Family for update testing',
      };

      const createResponse = await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(familyData)
        .expect(201);

      const updateFamily = createResponse.body.data.family;
      testFamilies.push(updateFamily);

      const updateData = {
        id: updateFamily.id,
        name: 'Updated by Editor',
        description: 'Updated by editor',
      };

      const response = await request(app.getHttpServer())
        .patch(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should delete family successfully as OWNER', async () => {
      // Create a separate family for deletion test
      const familyData = {
        name: 'Family To Delete',
        description: 'This family will be deleted',
      };

      const createResponse = await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(201);

      const familyToDelete = createResponse.body.data.family;
      testFamilies.push(familyToDelete);

      // Delete the family
      await request(app.getHttpServer())
        .delete(`/family/${testGroup.id}/${familyToDelete.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify family is deleted
      await request(app.getHttpServer())
        .get(`/family/${familyToDelete.id}`)
        .expect(404);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    let groupOwner: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'family.validation@example.com',
        password: 'password123',
        fullName: 'Family Validation User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Validation Test Group',
        description: 'Group for validation testing',
      });
    });

    it('should reject family creation with missing name', async () => {
      const familyData = {
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(400);
    });

    it('should reject family creation with empty name', async () => {
      const familyData = {
        name: '',
        description: 'Valid description',
      };

      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(400);
    });

    it('should reject family creation with missing description', async () => {
      const familyData = {
        name: 'Valid Name',
      };

      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(400);
    });

    it('should reject family creation with empty description', async () => {
      const familyData = {
        name: 'Valid Name',
        description: '',
      };

      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData)
        .expect(400);
    });

    it('should reject family update with missing family ID', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .patch(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject family update with empty family ID', async () => {
      const updateData = {
        id: '',
        name: 'Updated Name',
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .patch(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject family creation with empty payload', async () => {
      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      let testGroup: any;

      beforeAll(async () => {
        testGroup = await createTestGroup(
          await createTestUser({
            email: 'no.auth.family@example.com',
            password: 'password123',
            fullName: 'No Auth Family User',
          }),
          {
            name: 'No Auth Test Group',
            description: 'Group for no auth testing',
          },
        );
      });

      it('should reject family creation without authentication', async () => {
        const familyData = {
          name: 'Unauthorized Family',
          description: 'Should not be created',
        };

        await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .send(familyData)
          .expect(401);
      });

      it('should reject family update without authentication', async () => {
        const updateData = {
          id: 'some-family-id',
          name: 'Hacked Family',
        };

        await request(app.getHttpServer())
          .patch(`/family/${testGroup.id}`)
          .send(updateData)
          .expect(401);
      });

      it('should reject family deletion without authentication', async () => {
        await request(app.getHttpServer())
          .delete(`/family/${testGroup.id}/some-family-id`)
          .expect(401);
      });

      it('should reject getting family without authentication', async () => {
        await request(app.getHttpServer())
          .get('/family/some-family-id')
          .expect(401);
      });
    });

    describe('3.2 Role-based Permission Tests', () => {
      let groupOwner: any;
      let editorUser: any;
      let viewerUser: any;
      let nonMember: any;
      let testGroup: any;

      beforeAll(async () => {
        groupOwner = await createTestUser({
          email: 'role.family.owner@example.com',
          password: 'password123',
          fullName: 'Role Family Owner',
        });

        editorUser = await createTestUser({
          email: 'role.family.editor@example.com',
          password: 'password123',
          fullName: 'Role Family Editor',
        });

        viewerUser = await createTestUser({
          email: 'role.family.viewer@example.com',
          password: 'password123',
          fullName: 'Role Family Viewer',
        });

        nonMember = await createTestUser({
          email: 'role.family.nonmember@example.com',
          password: 'password123',
          fullName: 'Role Family Non Member',
        });

        // Create group
        testGroup = await createTestGroup(groupOwner, {
          name: 'Role Permission Test Group',
          description: 'Group for role family testing',
        });

        // Add users to group with different roles
        await addUserToGroup(testGroup, editorUser, 'EDITOR');
        await addUserToGroup(testGroup, viewerUser, 'VIEWER');
      });

      it('should allow OWNER to create family', async () => {
        const familyData = {
          name: 'Owner Created Family',
          description: 'Family created by owner',
        };

        const response = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(familyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        testFamilies.push(response.body.data.family);
      });

      it('should allow EDITOR to create family', async () => {
        const familyData = {
          name: 'Editor Created Family',
          description: 'Family created by editor',
        };

        const response = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(familyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        testFamilies.push(response.body.data.family);
      });

      it('should reject VIEWER from creating family', async () => {
        const familyData = {
          name: 'Viewer Created Family',
          description: 'Family created by viewer',
        };

        await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(familyData)
          .expect(403); // Forbidden due to insufficient role
      });

      it('should reject non-member from creating family', async () => {
        const familyData = {
          name: 'Non Member Created Family',
          description: 'Family created by non member',
        };

        await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(familyData)
          .expect(403); // Forbidden due to not being a member
      });

      it('should allow OWNER to update family', async () => {
        // Create a family first
        const familyData = {
          name: 'Update Test Family',
          description: 'Family for update testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Update the family
        const updateData = {
          id: family.id,
          name: 'Updated by Owner',
          description: 'Updated by owner',
        };

        const response = await request(app.getHttpServer())
          .patch(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
      });

      it('should allow EDITOR to update family', async () => {
        // Create a family first
        const familyData = {
          name: 'Editor Update Test Family',
          description: 'Family for editor update testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Update the family
        const updateData = {
          id: family.id,
          name: 'Updated by Editor',
          description: 'Updated by editor',
        };

        const response = await request(app.getHttpServer())
          .patch(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
      });

      it('should reject VIEWER from updating family', async () => {
        // Create a family first
        const familyData = {
          name: 'Viewer Update Test Family',
          description: 'Family for viewer update testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Try to update as viewer
        const updateData = {
          id: family.id,
          name: 'Hacked by Viewer',
          description: 'Hacked by viewer',
        };

        await request(app.getHttpServer())
          .patch(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden due to insufficient role
      });

      it('should reject non-member from updating family', async () => {
        const updateData = {
          id: 'some-family-id',
          name: 'Hacked by Non Member',
          description: 'Hacked by non member',
        };

        await request(app.getHttpServer())
          .patch(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden due to not being a member
      });

      it('should allow OWNER to delete family', async () => {
        // Create a family first
        const familyData = {
          name: 'Delete Test Family',
          description: 'Family for deletion testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Delete the family
        const response = await request(app.getHttpServer())
          .delete(`/family/${testGroup.id}/${family.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify family is deleted
        await request(app.getHttpServer())
          .get(`/family/${family.id}`)
          .expect(404);
      });

      it('should reject VIEWER from deleting family', async () => {
        // Create a family first
        const familyData = {
          name: 'Viewer Delete Test Family',
          description: 'Family for viewer deletion testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Try to delete as viewer
        await request(app.getHttpServer())
          .delete(`/family/${testGroup.id}/${family.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .expect(403); // Forbidden due to insufficient role
      });

      it('should reject non-member from deleting family', async () => {
        // Create a family first
        const familyData = {
          name: 'Non Member Delete Test Family',
          description: 'Family for non member deletion testing',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/family/${testGroup.id}`)
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(familyData)
          .expect(201);

        const family = createResponse.body.data.family;
        testFamilies.push(family);

        // Try to delete as non member
        await request(app.getHttpServer())
          .delete(`/family/${testGroup.id}/${family.id}`)
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .expect(403); // Forbidden due to not being a member
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    let groupOwner: any;
    let testGroup: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'business.family@example.com',
        password: 'password123',
        fullName: 'Business Family User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Business Logic Test Group',
        description: 'Group for business family testing',
      });
    });

    it('should return 404 for non-existent family', async () => {
      await request(app.getHttpServer())
        .get('/family/non-existent-family-id')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(404);
    });

    it('should return 404 when updating non-existent family', async () => {
      const updateData = {
        id: 'non-existent-family-id',
        name: 'Updated Name',
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .patch(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 404 when deleting non-existent family', async () => {
      await request(app.getHttpServer())
        .delete(`/family/${testGroup.id}/non-existent-family-id`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(404);
    });

    it('should enforce business rule: one family per group', async () => {
      // Create first family
      const familyData1 = {
        name: 'First Family',
        description: 'First family in group',
      };

      const response1 = await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(familyData1)
        .expect(201);

      const family1 = response1.body.data.family;
      testFamilies.push(family1);

      // Try to create second family (should fail due to business rule - this is CORRECT behavior!)
      const familyData2 = {
        name: 'Second Family',
        description:
          'Second family in group - should correctly fail business rule',
      };

      await request(app.getHttpServer())
        .post(`/family/${testGroup.id}`)
        .send(familyData2)
        .expect(400); // Should fail due to business rule (CORRECT!)
    });

    it('should update family owned by different user', async () => {
      // Create second user and different group
      const otherUser = await createTestUser({
        email: 'other.family@example.com',
        password: 'password123',
        fullName: 'Other Family User',
      });

      const otherGroup = await createTestGroup(otherUser, {
        name: 'Other Test Group',
        description: 'Other group for testing',
      });

      // Create family in other group
      const familyData = {
        name: 'Other Family',
        description: 'Family in other group',
      };

      const createResponse = await request(app.getHttpServer())
        .post(`/family/${otherGroup.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send(familyData)
        .expect(201);

      const otherFamily = createResponse.body.data.family;
      testFamilies.push(otherFamily);

      // Try to update family as original user
      const updateData = {
        id: otherFamily.id,
        name: 'Hacked Other Family',
        description: 'Hacked by other user',
      };

      await request(app.getHttpServer())
        .patch(`/family/${otherGroup.id}`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404); // Should fail - user doesn't own this family
    });
  });

  describe('5. INTEGRATION TESTS', () => {
    it('should complete full family management flow: Create Group -> Add Members -> Create Family -> Update -> Delete', async () => {
      // Step 1: Create group owner
      const owner = await createTestUser({
        email: 'integration.family@example.com',
        password: 'password123',
        fullName: 'Integration Family Owner',
      });

      // Step 2: Create group
      const group = await createTestGroup(owner, {
        name: 'Integration Family Test Group',
        description: 'Group for family integration testing',
      });

      // Step 3: Create family
      const familyData = {
        name: 'Integration Test Family',
        description: 'Family for integration testing',
      };

      const familyResponse = await request(app.getHttpServer())
        .post(`/family/${group.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(familyData)
        .expect(201);

      expect(familyResponse.body.success).toBe(true);
      expect(familyResponse.body.data.family.name).toBe(familyData.name);
      expect(familyResponse.body.data.family.description).toBe(
        familyData.description,
      );
      expect(familyResponse.body.data.family.owner.fullName).toBe(
        owner.fullName,
      );

      const familyId = familyResponse.body.data.family.id;
      testFamilies.push(familyResponse.body.data.family);

      // Step 4: Get family and verify structure
      const getResponse = await request(app.getHttpServer())
        .get(`/family/${familyId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(familyId);
      expect(getResponse.body.data.name).toBe(familyData.name);
      expect(getResponse.body.data.description).toBe(familyData.description);
      expect(getResponse.body.data.owner).toBeDefined();
      expect(getResponse.body.data._count).toBeDefined();

      // Step 5: Update family
      const updateData = {
        id: familyId,
        name: 'Updated Integration Family',
        description: 'Updated integration family description',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/family/${group.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.description).toBe(updateData.description);

      // Step 6: Verify update persisted
      const verifyResponse = await request(app.getHttpServer())
        .get(`/family/${familyId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(verifyResponse.body.data.name).toBe(updateData.name);
      expect(verifyResponse.body.data.description).toBe(updateData.description);

      // Step 7: Delete family
      await request(app.getHttpServer())
        .delete(`/family/${group.id}/${familyId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      // Step 8: Verify family is deleted
      await request(app.getHttpServer())
        .get(`/family/${familyId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(404);

      // Add to cleanup
      testGroups.push(group);
    });

    it('should complete role-based family access flow: Owner -> Editor -> Viewer -> Non-member', async () => {
      // Step 1: Create group owner and add members
      const owner = await createTestUser({
        email: 'role.integration.owner@example.com',
        password: 'password123',
        fullName: 'Role Integration Owner',
      });

      const editor = await createTestUser({
        email: 'role.integration.editor@example.com',
        password: 'password123',
        fullName: 'Role Integration Editor',
      });

      const viewer = await createTestUser({
        email: 'role.integration.viewer@example.com',
        password: 'password123',
        fullName: 'Role Integration Viewer',
      });

      const nonMember = await createTestUser({
        email: 'role.integration.nonmember@example.com',
        password: 'password123',
        fullName: 'Role Integration Non Member',
      });

      const group = await createTestGroup(owner, {
        name: 'Role Integration Test Group',
        description: 'Group for role integration testing',
      });

      // Add users to group with proper roles
      await addUserToGroup(group, editor, 'EDITOR');
      await addUserToGroup(group, viewer, 'VIEWER');

      // Step 2: Owner creates family
      const familyData = {
        name: 'Role Integration Family',
        description: 'Family for role integration testing',
      };

      const familyResponse = await request(app.getHttpServer())
        .post(`/family/${group.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(familyData)
        .expect(201);

      const family = familyResponse.body.data.family;
      testFamilies.push(family);

      // Step 3: Editor can update family (successful)
      const editorUpdateData = {
        id: family.id,
        name: 'Updated by Editor',
        description: 'Updated by editor',
      };

      const editorUpdateResponse = await request(app.getHttpServer())
        .patch(`/family/${group.id}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .send(editorUpdateData)
        .expect(200);

      expect(editorUpdateResponse.body.success).toBe(true);
      expect(editorUpdateResponse.body.data.name).toBe(editorUpdateData.name);

      // Step 4: Viewer cannot update family (forbidden)
      const viewerUpdateData = {
        id: family.id,
        name: 'Hacked by Viewer',
        description: 'Hacked by viewer',
      };

      await request(app.getHttpServer())
        .patch(`/family/${group.id}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send(viewerUpdateData)
        .expect(403); // Forbidden

      // Step 5: Non-member cannot update family (forbidden)
      const nonMemberUpdateData = {
        id: family.id,
        name: 'Hacked by Non-member',
        description: 'Hacked by non-member',
      };

      await request(app.getHttpServer())
        .patch(`/family/${group.id}`)
        .set('Authorization', `Bearer ${nonMember.accessToken}`)
        .send(nonMemberUpdateData)
        .expect(403); // Forbidden

      // Step 6: Owner can delete family (successful)
      await request(app.getHttpServer())
        .delete(`/family/${group.id}/${family.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      // Step 7: Editor cannot delete family (forbidden)
      await request(app.getHttpServer())
        .delete(`/family/${group.id}/${family.id}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .expect(403); // Forbidden

      // Step 8: Non-member cannot delete family (forbidden)
      await request(app.getHttpServer())
        .delete(`/family/${group.id}/${family.id}`)
        .set('Authorization', `Bearer ${nonMember.accessToken}`)
        .expect(403); // Forbidden

      // Add to cleanup
      testGroups.push(group);
    });
  });
});
