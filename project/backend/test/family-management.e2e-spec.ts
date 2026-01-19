import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * E2E Tests for Family Management Service
 *
 * Test Flow Description:
 * 1. Guest Registration - New user creates an account
 * 2. User Authentication - Login to get access tokens
 * 3. Group Family Creation - Create a family group as owner
 * 4. Family Creation - Create a specific family within the group
 * 5. Member Creation - Add family members to the family
 * 6. Relationship Creation - Establish relationships between members
 *
 * Edge Cases Tested:
 * - Invalid authentication scenarios
 * - Permission/role-based access control
 * - Data validation errors
 * - Duplicate resource creation
 * - Unauthorized access attempts
 * - Missing required fields
 * - Invalid data formats
 * - File upload scenarios
 * - Resource deletion and cleanup
 */

describe('Family Management E2E Tests', () => {
  let app: INestApplication<App>;
  let authToken: { accessToken: string; refreshToken: string };
  let userId: string;
  let groupId: string;
  let familyId: string;
  let memberId1: string;
  let memberId2: string;
  let relationshipId: string;

  const testUser = {
    email: 'testuser@example.com',
    password: 'password123',
    fullName: 'Test User',
  };

  const testGroup = {
    name: 'Test Family Group',
    description: 'A test group for family management',
    role: 'OWNER',
  };

  const testFamily = {
    name: 'Johnson Family',
    description: 'The Johnson family lineage',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Flow', () => {
    it('should register a new user (Guest -> Registered User)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.fullName).toBe(testUser.fullName);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      authToken = response.body.data.tokens;
      userId = response.body.data.user.id;
    });

    it('should not register duplicate user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should not register with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should not register with short password', async () => {
      const invalidUser = { ...testUser, password: '123' };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      authToken = response.body.data.tokens;
    });

    it('should not login with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-base')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      authToken.accessToken = response.body.data.accessToken;
    });
  });

  describe('2. User Profile Management', () => {
    it('should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Test User',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(updateData.fullName);
    });

    it('should not access user profile without authentication', async () => {
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(401);
    });
  });

  describe('3. Group Family Management', () => {
    it('should create a new group family', async () => {
      const response = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(testGroup)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testGroup.name);
      expect(response.body.data.description).toBe(testGroup.description);

      groupId = response.body.data.id;
    });

    it('should get all group families for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get specific group family', async () => {
      const response = await request(app.getHttpServer())
        .get(`/group-family/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(groupId);
    });

    it('should update group family', async () => {
      const updateData = {
        name: 'Updated Test Group',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/group-family/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should not create group without authentication', async () => {
      await request(app.getHttpServer())
        .post('/group-family')
        .send(testGroup)
        .expect(401);
    });

    it('should not create group with empty name', async () => {
      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send({ ...testGroup, name: '' })
        .expect(400);
    });
  });

  describe('4. Family Management', () => {
    it('should create a new family within group', async () => {
      const response = await request(app.getHttpServer())
        .post(`/family/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(testFamily)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testFamily.name);
      expect(response.body.data.description).toBe(testFamily.description);

      familyId = response.body.data.id;
    });

    it('should get family by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/family/${familyId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(familyId);
    });

    it('should update family', async () => {
      const updateData = {
        name: 'Updated Johnson Family',
        description: 'Updated family description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/family/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should not create family without proper permissions', async () => {
      // Create a second user with viewer role
      const secondUser = {
        email: 'viewer@example.com',
        password: 'password123',
        fullName: 'Viewer User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(secondUser)
        .expect(201);

      const viewerToken = registerResponse.body.data.tokens.accessToken;

      // Try to create family without owner/editor role
      await request(app.getHttpServer())
        .post(`/family/${groupId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(testFamily)
        .expect(403);
    });

    it('should not create family without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/family/${groupId}`)
        .send(testFamily)
        .expect(401);
    });
  });

  describe('5. Family Members Management', () => {
    const testMember1 = {
      familyId: familyId,
      fullName: 'John Johnson',
      gender: 'MALE',
      dateOfBirth: '1980-05-15',
      isAlive: true,
      generation: 2,
      biography: 'Father of the family',
    };

    const testMember2 = {
      familyId: familyId,
      fullName: 'Jane Johnson',
      gender: 'FEMALE',
      dateOfBirth: '1982-08-22',
      isAlive: true,
      generation: 2,
      biography: 'Mother of the family',
    };

    it('should create first family member', async () => {
      const response = await request(app.getHttpServer())
        .post(`/member/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .field('familyId', testMember1.familyId)
        .field('fullName', testMember1.fullName)
        .field('gender', testMember1.gender)
        .field('dateOfBirth', testMember1.dateOfBirth)
        .field('isAlive', testMember1.isAlive.toString())
        .field('generation', testMember1.generation.toString())
        .field('biography', testMember1.biography)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(testMember1.fullName);
      expect(response.body.data.gender).toBe(testMember1.gender);

      memberId1 = response.body.data.id;
    });

    it('should create second family member', async () => {
      const response = await request(app.getHttpServer())
        .post(`/member/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .field('familyId', testMember2.familyId)
        .field('fullName', testMember2.fullName)
        .field('gender', testMember2.gender)
        .field('dateOfBirth', testMember2.dateOfBirth)
        .field('isAlive', testMember2.isAlive.toString())
        .field('generation', testMember2.generation.toString())
        .field('biography', testMember2.biography)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(testMember2.fullName);

      memberId2 = response.body.data.id;
    });

    it('should get all family members', async () => {
      const response = await request(app.getHttpServer())
        .get(`/member/${familyId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should get specific family member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/member/${familyId}/${memberId1}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(memberId1);
    });

    it('should update family member', async () => {
      const updateData = {
        id: memberId1,
        fullName: 'Updated John Johnson',
        biography: 'Updated biography',
      };

      const response = await request(app.getHttpServer())
        .patch(`/member/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .field('id', updateData.id)
        .field('fullName', updateData.fullName)
        .field('biography', updateData.biography)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(updateData.fullName);
    });

    it('should not create member with invalid gender', async () => {
      const invalidMember = {
        ...testMember1,
        gender: 'INVALID',
      };

      await request(app.getHttpServer())
        .post(`/member/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .field('familyId', invalidMember.familyId)
        .field('fullName', invalidMember.fullName)
        .field('gender', invalidMember.gender)
        .field('dateOfBirth', invalidMember.dateOfBirth)
        .field('isAlive', invalidMember.isAlive.toString())
        .field('generation', invalidMember.generation.toString())
        .expect(400);
    });

    it('should not create member without family ID', async () => {
      const { familyId, ...invalidMember } = testMember1;

      await request(app.getHttpServer())
        .post(`/member/${groupId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .field('fullName', invalidMember.fullName)
        .field('gender', invalidMember.gender)
        .field('dateOfBirth', invalidMember.dateOfBirth)
        .field('isAlive', invalidMember.isAlive.toString())
        .field('generation', invalidMember.generation.toString())
        .expect(400);
    });
  });

  describe('6. Relationships Management', () => {
    const testRelationship = {
      memberId1: memberId1,
      memberId2: memberId2,
      familyId: familyId,
      relationshipType: 'SPOUSE',
    };

    it('should create relationship between members', async () => {
      const response = await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(testRelationship)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memberId1).toBe(testRelationship.memberId1);
      expect(response.body.data.memberId2).toBe(testRelationship.memberId2);
      expect(response.body.data.relationshipType).toBe(
        testRelationship.relationshipType,
      );

      relationshipId = response.body.data.id;
    });

    it('should update relationship', async () => {
      const updateData = {
        relationshipType: 'EX_SPOUSE',
      };

      const response = await request(app.getHttpServer())
        .put(`/relationship/${relationshipId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.relationshipType).toBe(
        updateData.relationshipType,
      );
    });

    it('should not create relationship with non-existent member', async () => {
      const invalidRelationship = {
        ...testRelationship,
        memberId1: 'non-existent-id',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(invalidRelationship)
        .expect(404);
    });

    it('should not create relationship without authentication', async () => {
      await request(app.getHttpServer())
        .post('/relationship')
        .send(testRelationship)
        .expect(401);
    });

    it('should not update relationship without proper permissions', async () => {
      const viewerUser = {
        email: 'viewer2@example.com',
        password: 'password123',
        fullName: 'Viewer User 2',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(viewerUser)
        .expect(201);

      const viewerToken = registerResponse.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .put(`/relationship/${relationshipId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ relationshipType: 'SIBLING' })
        .expect(403);
    });
  });

  describe('7. Edge Cases and Error Handling', () => {
    it('should handle invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle missing Authorization header', async () => {
      await request(app.getHttpServer()).get('/group-family').expect(401);
    });

    it('should handle malformed JSON in requests', async () => {
      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle non-existent resource IDs', async () => {
      await request(app.getHttpServer())
        .get('/group-family/non-existent-id')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(404);
    });

    it('should handle very long strings in input', async () => {
      const longString = 'a'.repeat(1000);
      const invalidGroup = {
        name: longString,
        description: 'Test description',
      };

      await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .send(invalidGroup)
        .expect(400);
    });
  });

  describe('8. Data Cleanup', () => {
    it('should delete relationship', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/relationship/${familyId}/${relationshipId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should delete family member', async () => {
      await request(app.getHttpServer())
        .delete(`/member/${familyId}/${memberId1}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);
    });

    it('should delete family', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/family/${groupId}/${familyId}`)
        .set('Authorization', `Bearer ${authToken.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not delete resources without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/relationship/${familyId}/${relationshipId}`)
        .expect(401);
    });
  });

  describe('9. Complete Flow Integration Test', () => {
    let integrationUserId: string;
    let integrationToken: { accessToken: string; refreshToken: string };
    let integrationGroupId: string;
    let integrationFamilyId: string;

    it('should complete full user journey: Guest -> Register -> Create Group -> Create Family -> Add Members -> Create Relationships', async () => {
      // Step 1: Register new user
      const newUser = {
        email: 'integration@example.com',
        password: 'password123',
        fullName: 'Integration Test User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      integrationUserId = registerResponse.body.data.user.id;
      integrationToken = registerResponse.body.data.tokens;

      // Step 2: Create group family
      const newGroup = {
        name: 'Integration Test Group',
        description: 'Group for integration testing',
      };

      const groupResponse = await request(app.getHttpServer())
        .post('/group-family')
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .send(newGroup)
        .expect(201);

      integrationGroupId = groupResponse.body.data.id;

      // Step 3: Create family
      const newFamily = {
        name: 'Integration Test Family',
        description: 'Family for integration testing',
      };

      const familyResponse = await request(app.getHttpServer())
        .post(`/family/${integrationGroupId}`)
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .send(newFamily)
        .expect(201);

      integrationFamilyId = familyResponse.body.data.id;

      // Step 4: Add family members
      const father = {
        familyId: integrationFamilyId,
        fullName: 'Integration Father',
        gender: 'MALE',
        dateOfBirth: '1975-03-10',
        isAlive: true,
        generation: 1,
      };

      const mother = {
        familyId: integrationFamilyId,
        fullName: 'Integration Mother',
        gender: 'FEMALE',
        dateOfBirth: '1978-07-15',
        isAlive: true,
        generation: 1,
      };

      const fatherResponse = await request(app.getHttpServer())
        .post(`/member/${integrationGroupId}`)
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .field('familyId', father.familyId)
        .field('fullName', father.fullName)
        .field('gender', father.gender)
        .field('dateOfBirth', father.dateOfBirth)
        .field('isAlive', father.isAlive.toString())
        .field('generation', father.generation.toString())
        .expect(201);

      const motherResponse = await request(app.getHttpServer())
        .post(`/member/${integrationGroupId}`)
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .field('familyId', mother.familyId)
        .field('fullName', mother.fullName)
        .field('gender', mother.gender)
        .field('dateOfBirth', mother.dateOfBirth)
        .field('isAlive', mother.isAlive.toString())
        .field('generation', mother.generation.toString())
        .expect(201);

      // Step 5: Create relationship
      const relationship = {
        memberId1: fatherResponse.body.data.id,
        memberId2: motherResponse.body.data.id,
        familyId: integrationFamilyId,
        relationshipType: 'SPOUSE',
      };

      await request(app.getHttpServer())
        .post('/relationship')
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .send(relationship)
        .expect(201);

      // Verify all data is correctly created and accessible
      const groupsResponse = await request(app.getHttpServer())
        .get('/group-family')
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .expect(200);

      expect(groupsResponse.body.data.length).toBe(1);

      const membersResponse = await request(app.getHttpServer())
        .get(`/member/${integrationFamilyId}`)
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .expect(200);

      expect(membersResponse.body.data.length).toBe(2);

      // Cleanup integration test data
      await request(app.getHttpServer())
        .delete(`/family/${integrationGroupId}/${integrationFamilyId}`)
        .set('Authorization', `Bearer ${integrationToken.accessToken}`)
        .expect(200);
    });
  });
});
