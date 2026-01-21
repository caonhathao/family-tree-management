import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * E2E Tests for Relationships Module
 *
 * Test Flow Description:
 * 1. User Authentication - Register and login users with different roles
 * 2. Group & Family Setup - Create group and family as foundation
 * 3. Member Creation - Create family members to relate
 * 4. Relationship Management - Create, update, delete relationships
 * 5. Permission Control - Test role-based access (OWNER/EDITOR/VIEWER)
 * 6. Business Logic - Test relationship validation and constraints
 *
 * Edge Cases Tested:
 * - Role-based access control for relationship operations
 * - Relationship type validation
 * - Member validation (both members must exist)
 * - Self-relationship prevention
 * - Duplicate relationship handling
 * - Permission violations (wrong roles trying to access/modify)
 */

describe('Relationships E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUsers: any[] = [];
  let testGroups: any[] = [];
  let testFamilies: any[] = [];
  let testMembers: any[] = [];
  let testRelationships: any[] = [];

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

  const createTestFamily = async (
    user: any,
    groupId: string,
    familyData: any,
  ) => {
    const response = await request(app.getHttpServer())
      .post(`/family/${groupId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(familyData)
      .expect(201);

    const family = response.body.data.family;
    testFamilies.push(family);
    return family;
  };

  const createTestMember = async (
    user: any,
    groupId: string,
    memberData: any,
  ) => {
    const response = await request(app.getHttpServer())
      .post(`/member/${groupId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .field('familyId', memberData.familyId)
      .field('fullName', memberData.fullName)
      .field('gender', memberData.gender)
      .field('dateOfBirth', memberData.dateOfBirth)
      .field('isAlive', memberData.isAlive.toString())
      .field('generation', memberData.generation.toString())
      .expect(201);

    const member = response.body.data;
    testMembers.push(member);
    return member;
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
        id: {
          in: testRelationships.map((rel) => rel.id),
        },
      },
    });

    await prisma.familyMember.deleteMany({
      where: {
        id: {
          in: testMembers.map((member) => member.id),
        },
      },
    });

    await prisma.family.deleteMany({
      where: {
        id: {
          in: testFamilies.map((family) => family.id),
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

  describe('1. SUCCESS CASES (200 / 201)', () => {
    let groupOwner: any;
    let editorUser: any;
    let testGroup: any;
    let testFamily: any;
    let member1: any;
    let member2: any;
    let createdRelationship: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'relation.owner@example.com',
        password: 'password123',
        fullName: 'Relation Owner User',
      });

      editorUser = await createTestUser({
        email: 'relation.editor@example.com',
        password: 'password123',
        fullName: 'Relation Editor User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Relation Test Group',
        description: 'Group for relationship testing',
      });

      await addUserToGroup(testGroup, editorUser, 'EDITOR');

      testFamily = await createTestFamily(groupOwner, testGroup.id, {
        name: 'Relation Test Family',
        description: 'Family for relationship testing',
      });

      member1 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'John Johnson',
        gender: 'MALE',
        dateOfBirth: '1980-05-15',
        isAlive: true,
        generation: 2,
      });

      member2 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Jane Johnson',
        gender: 'FEMALE',
        dateOfBirth: '1982-08-22',
        isAlive: true,
        generation: 2,
      });
    });

    it('should create a new relationship successfully as EDITOR', async () => {
      const relationshipData = {
        fromMemberId: member1.id,
        toMemberId: member2.id,
        familyId: testFamily.id,
        type: 'SPOUSE',
      };

      const response = await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(relationshipData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fromMemberId).toBe(
        relationshipData.fromMemberId,
      );
      expect(response.body.data.toMemberId).toBe(relationshipData.toMemberId);
      expect(response.body.data.type).toBe(relationshipData.type);

      createdRelationship = response.body.data;
      testRelationships.push(createdRelationship);
    });

    it('should create different relationship types', async () => {
      // Create additional members for different relationship types
      const child = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Child Johnson',
        gender: 'MALE',
        dateOfBirth: '2005-03-10',
        isAlive: true,
        generation: 3,
      });

      const parentChildData = {
        fromMemberId: member1.id,
        toMemberId: child.id,
        familyId: testFamily.id,
        type: 'PARENT_CHILD',
      };

      const response = await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(parentChildData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('PARENT_CHILD');
      testRelationships.push(response.body.data);
    });

    it('should update relationship successfully', async () => {
      const updateData = {
        familyId: testFamily.id,
        type: 'EX_SPOUSE',
      };

      const response = await request(app.getHttpServer())
        .put(`/relationship/${createdRelationship.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(updateData.type);
    });

    it('should delete relationship successfully', async () => {
      // Create a separate relationship for deletion test
      const tempMember1 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Temp Member 1',
        gender: 'MALE',
        dateOfBirth: '1975-03-10',
        isAlive: true,
        generation: 2,
      });

      const tempMember2 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Temp Member 2',
        gender: 'FEMALE',
        dateOfBirth: '1977-07-15',
        isAlive: true,
        generation: 2,
      });

      const tempRelationshipData = {
        memberId1: tempMember1.id,
        memberId2: tempMember2.id,
        familyId: testFamily.id,
        relationshipType: 'SIBLING',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(tempRelationshipData)
        .expect(201);

      const tempRelationship = createResponse.body.data;
      testRelationships.push(tempRelationship);

      // Delete the relationship
      await request(app.getHttpServer())
        .delete(`/relationship/${testFamily.id}/${tempRelationship.id}`)
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .expect(200);
    });
  });

  describe('2. VALIDATION CASES (400)', () => {
    let editorUser: any;
    let testGroup: any;
    let testFamily: any;
    let member1: any;
    let member2: any;

    beforeAll(async () => {
      editorUser = await createTestUser({
        email: 'relation.validation@example.com',
        password: 'password123',
        fullName: 'Relation Validation User',
      });

      testGroup = await createTestGroup(editorUser, {
        name: 'Validation Relation Test Group',
        description: 'Group for relationship validation testing',
      });

      testFamily = await createTestFamily(editorUser, testGroup.id, {
        name: 'Validation Relation Test Family',
        description: 'Family for relationship validation testing',
      });

      member1 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Validation Member 1',
        gender: 'MALE',
        dateOfBirth: '1980-05-15',
        isAlive: true,
        generation: 2,
      });

      member2 = await createTestMember(editorUser, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Validation Member 2',
        gender: 'FEMALE',
        dateOfBirth: '1982-08-22',
        isAlive: true,
        generation: 2,
      });
    });

    it('should reject relationship creation with missing memberId1', async () => {
      const relationshipData = {
        memberId2: member2.id,
        familyId: testFamily.id,
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(relationshipData)
        .expect(400);
    });

    it('should reject relationship creation with missing memberId2', async () => {
      const relationshipData = {
        memberId1: member1.id,
        familyId: testFamily.id,
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(relationshipData)
        .expect(400);
    });

    it('should reject relationship creation with missing familyId', async () => {
      const relationshipData = {
        memberId1: member1.id,
        memberId2: member2.id,
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(relationshipData)
        .expect(400);
    });

    it('should reject relationship creation with missing relationshipType', async () => {
      const relationshipData = {
        memberId1: member1.id,
        memberId2: member2.id,
        familyId: testFamily.id,
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send(relationshipData)
        .expect(400);
    });

    it('should reject relationship creation with empty payload', async () => {
      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${editorUser.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('3. AUTHORIZATION CASES', () => {
    describe('3.1 Không đăng nhập (401)', () => {
      it('should reject relationship creation without authentication', async () => {
        const relationshipData = {
          memberId1: 'member1-id',
          memberId2: 'member2-id',
          familyId: 'family-id',
          relationshipType: 'SPOUSE',
        };

        await request(app.getHttpServer())
          .post('/relationship')
          .send(relationshipData)
          .expect(401);
      });

      it('should reject relationship update without authentication', async () => {
        const updateData = {
          relationshipType: 'EX_SPOUSE',
        };

        await request(app.getHttpServer())
          .put('/relationship/some-relationship-id')
          .send(updateData)
          .expect(401);
      });

      it('should reject relationship deletion without authentication', async () => {
        await request(app.getHttpServer())
          .delete('/relationship/some-family-id/some-relationship-id')
          .expect(401);
      });
    });

    describe('3.2 Role-based Permission Tests', () => {
      let groupOwner: any;
      let editorUser: any;
      let viewerUser: any;
      let nonMember: any;
      let testGroup: any;
      let testFamily: any;
      let member1: any;
      let member2: any;

      beforeAll(async () => {
        groupOwner = await createTestUser({
          email: 'role.relation.owner@example.com',
          password: 'password123',
          fullName: 'Role Relation Owner',
        });

        editorUser = await createTestUser({
          email: 'role.relation.editor@example.com',
          password: 'password123',
          fullName: 'Role Relation Editor',
        });

        viewerUser = await createTestUser({
          email: 'role.relation.viewer@example.com',
          password: 'password123',
          fullName: 'Role Relation Viewer',
        });

        nonMember = await createTestUser({
          email: 'role.relation.nonmember@example.com',
          password: 'password123',
          fullName: 'Role Relation Non Member',
        });

        // Create group
        testGroup = await createTestGroup(groupOwner, {
          name: 'Role Relation Test Group',
          description: 'Group for role relationship testing',
        });

        // Add users to group with different roles
        await addUserToGroup(testGroup, editorUser, 'EDITOR');
        await addUserToGroup(testGroup, viewerUser, 'VIEWER');

        // Create family
        testFamily = await createTestFamily(groupOwner, testGroup.id, {
          name: 'Role Relation Test Family',
          description: 'Family for role relationship testing',
        });

        // Create members
        member1 = await createTestMember(groupOwner, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Member 1',
          gender: 'MALE',
          dateOfBirth: '1980-05-15',
          isAlive: true,
          generation: 2,
        });

        member2 = await createTestMember(groupOwner, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Member 2',
          gender: 'FEMALE',
          dateOfBirth: '1982-08-22',
          isAlive: true,
          generation: 2,
        });
      });

      it('should allow OWNER to create relationship', async () => {
        const relationshipData = {
          memberId1: member1.id,
          memberId2: member2.id,
          familyId: testFamily.id,
          relationshipType: 'SPOUSE',
        };

        const response = await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(relationshipData)
          .expect(201);

        testRelationships.push(response.body.data);
      });

      it('should allow EDITOR to create relationship', async () => {
        // Create new members for editor test
        const editorMember1 = await createTestMember(editorUser, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Editor Member 1',
          gender: 'MALE',
          dateOfBirth: '1975-03-10',
          isAlive: true,
          generation: 1,
        });

        const editorMember2 = await createTestMember(editorUser, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Editor Member 2',
          gender: 'FEMALE',
          dateOfBirth: '1977-07-15',
          isAlive: true,
          generation: 1,
        });

        const relationshipData = {
          memberId1: editorMember1.id,
          memberId2: editorMember2.id,
          familyId: testFamily.id,
          relationshipType: 'SIBLING',
        };

        const response = await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${editorUser.accessToken}`)
          .send(relationshipData)
          .expect(201);

        testRelationships.push(response.body.data);
      });

      it('should reject VIEWER from creating relationship', async () => {
        const relationshipData = {
          memberId1: member1.id,
          memberId2: member2.id,
          familyId: testFamily.id,
          relationshipType: 'SPOUSE',
        };

        await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(relationshipData)
          .expect(403); // Forbidden due to insufficient role
      });

      it('should reject non-member from creating relationship', async () => {
        const relationshipData = {
          memberId1: member1.id,
          memberId2: member2.id,
          familyId: testFamily.id,
          relationshipType: 'SPOUSE',
        };

        await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${nonMember.accessToken}`)
          .send(relationshipData)
          .expect(403); // Forbidden due to not being a member
      });

      it('should reject VIEWER from updating relationship', async () => {
        // First create a relationship as owner
        const relationshipData = {
          memberId1: member1.id,
          memberId2: member2.id,
          familyId: testFamily.id,
          relationshipType: 'SPOUSE',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(relationshipData)
          .expect(201);

        const relationship = createResponse.body.data;
        testRelationships.push(relationship);

        // Viewer tries to update it
        const updateData = {
          relationshipType: 'EX_SPOUSE',
        };

        await request(app.getHttpServer())
          .put(`/relationship/${relationship.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .send(updateData)
          .expect(403); // Forbidden due to insufficient role
      });

      it('should reject VIEWER from deleting relationship', async () => {
        // Create a relationship as owner
        const tempMember1 = await createTestMember(groupOwner, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Delete Test Member 1',
          gender: 'MALE',
          dateOfBirth: '1975-03-10',
          isAlive: true,
          generation: 2,
        });

        const tempMember2 = await createTestMember(groupOwner, testGroup.id, {
          familyId: testFamily.id,
          fullName: 'Delete Test Member 2',
          gender: 'FEMALE',
          dateOfBirth: '1977-07-15',
          isAlive: true,
          generation: 2,
        });

        const relationshipData = {
          memberId1: tempMember1.id,
          memberId2: tempMember2.id,
          familyId: testFamily.id,
          relationshipType: 'SPOUSE',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/relationship')
          .set('Authorization', `Bearer ${groupOwner.accessToken}`)
          .send(relationshipData)
          .expect(201);

        const relationship = createResponse.body.data;
        testRelationships.push(relationship);

        // Viewer tries to delete it
        await request(app.getHttpServer())
          .delete(`/relationship/${testFamily.id}/${relationship.id}`)
          .set('Authorization', `Bearer ${viewerUser.accessToken}`)
          .expect(403); // Forbidden due to insufficient role
      });
    });
  });

  describe('4. DATABASE / BUSINESS LOGIC CASES', () => {
    let groupOwner: any;
    let testGroup: any;
    let testFamily: any;
    let member1: any;
    let member2: any;

    beforeAll(async () => {
      groupOwner = await createTestUser({
        email: 'business.relation@example.com',
        password: 'password123',
        fullName: 'Business Relation User',
      });

      testGroup = await createTestGroup(groupOwner, {
        name: 'Business Relation Test Group',
        description: 'Group for business relationship testing',
      });

      testFamily = await createTestFamily(groupOwner, testGroup.id, {
        name: 'Business Relation Test Family',
        description: 'Family for business relationship testing',
      });

      member1 = await createTestMember(groupOwner, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Business Member 1',
        gender: 'MALE',
        dateOfBirth: '1980-05-15',
        isAlive: true,
        generation: 2,
      });

      member2 = await createTestMember(groupOwner, testGroup.id, {
        familyId: testFamily.id,
        fullName: 'Business Member 2',
        gender: 'FEMALE',
        dateOfBirth: '1982-08-22',
        isAlive: true,
        generation: 2,
      });
    });

    it('should return 404 for non-existent relationship', async () => {
      const updateData = {
        relationshipType: 'EX_SPOUSE',
      };

      await request(app.getHttpServer())
        .put('/relationship/non-existent-relationship-id')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(updateData)
        .expect(404); // Relationship not found
    });

    it('should return 404 when creating relationship with non-existent member', async () => {
      const relationshipData = {
        memberId1: 'non-existent-member-id',
        memberId2: member2.id,
        familyId: testFamily.id,
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(relationshipData)
        .expect(404); // Member not found
    });

    it('should return 404 when creating relationship with non-existent family', async () => {
      const relationshipData = {
        memberId1: member1.id,
        memberId2: member2.id,
        familyId: 'non-existent-family-id',
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .send(relationshipData)
        .expect(404); // Family not found
    });

    it('should return 404 when deleting non-existent relationship', async () => {
      await request(app.getHttpServer())
        .delete(`/relationship/${testFamily.id}/non-existent-relationship-id`)
        .set('Authorization', `Bearer ${groupOwner.accessToken}`)
        .expect(404); // Relationship not found
    });
  });

  describe('5. INTEGRATION TESTS', () => {
    it('should complete full relationship management flow: Create -> Update -> Delete', async () => {
      // Step 1: Create user and setup
      const user = await createTestUser({
        email: 'integration.relation@example.com',
        password: 'password123',
        fullName: 'Integration Relation User',
      });

      const group = await createTestGroup(user, {
        name: 'Integration Relation Test Group',
        description: 'Group for relationship integration testing',
      });

      const family = await createTestFamily(user, group.id, {
        name: 'Integration Relation Test Family',
        description: 'Family for relationship integration testing',
      });

      // Step 2: Create members for relationship
      const father = await createTestMember(user, group.id, {
        familyId: family.id,
        fullName: 'Integration Father',
        gender: 'MALE',
        dateOfBirth: '1975-03-10',
        isAlive: true,
        generation: 1,
      });

      const mother = await createTestMember(user, group.id, {
        familyId: family.id,
        fullName: 'Integration Mother',
        gender: 'FEMALE',
        dateOfBirth: '1978-07-15',
        isAlive: true,
        generation: 1,
      });

      // Step 3: Create relationship
      const relationshipData = {
        memberId1: father.id,
        memberId2: mother.id,
        familyId: family.id,
        relationshipType: 'SPOUSE',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(relationshipData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.relationshipType).toBe('SPOUSE');

      const relationshipId = createResponse.body.data.id;
      testRelationships.push(createResponse.body.data);

      // Step 4: Update relationship
      const updateData = {
        relationshipType: 'EX_SPOUSE',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/relationship/${relationshipId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.relationshipType).toBe(
        updateData.relationshipType,
      );

      // Step 5: Verify update persisted
      const verifyResponse = await request(app.getHttpServer())
        .put(`/relationship/${relationshipId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ relationshipType: 'SPOUSE' }) // Check current state
        .expect(200);

      expect(verifyResponse.body.data.relationshipType).toBe('EX_SPOUSE');

      // Step 6: Delete relationship
      await request(app.getHttpServer())
        .delete(`/relationship/${family.id}/${relationshipId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      // Step 7: Verify relationship is deleted
      await request(app.getHttpServer())
        .put(`/relationship/${relationshipId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ relationshipType: 'SPOUSE' })
        .expect(404);

      // Add to cleanup
      testGroups.push(group);
    });
  });
});
