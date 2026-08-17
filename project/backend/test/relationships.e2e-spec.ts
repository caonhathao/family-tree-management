import { INestApplication } from '@nestjs/common';
import { MEMBER_ROLE } from '@prisma/client';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import { ApiDataResponse } from 'src/common/constants/api';
import { createTestUser } from './helpers/auth.helpers';
import { createGroup as apiCreateGroup } from './helpers/group.helpers';
import { GroupResponse } from 'src/modules/group-family/types/group-family-response.type';
import { NewFamilyResponse } from 'src/modules/family/types/family-response.type';
import {
  FamilyMemberData,
  FamilyMemberResponse,
} from 'src/modules/family-members/types/family-member-response.type';
import {
  RelationshipCreationResponse,
  RelationshipMapResponse,
  RelationshipResponse,
} from 'src/modules/relationships/types/relationship-response.type';
import {
  generateRandomFamily,
  generateRandomMember,
  generateRandomUser,
} from './factories';

// ===========================================================================================
// TEST SUITE
// ===========================================================================================

describe('Relationships (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: TestApi;

  // ===========================================================================================
  // HELPER FUNCTIONS
  // ===========================================================================================

  const registerAndLogin = async (
    userDto = generateRandomUser(),
  ): Promise<{ token: string; userId: string }> => {
    const user = await createTestUser(api, userDto);
    return {
      token: user.accessToken,
      userId: user.id,
    };
  };

  const createGroup = async (
    token: string,
    groupDto: { name: string; description: string } = {
      name: 'Test Group',
      description: 'A group for testing',
    },
  ): Promise<GroupResponse> => apiCreateGroup(api, token, groupDto);

  const createFamily = async (
    token: string,
    groupId: string,
    familyDto: { name: string; description?: string } = generateRandomFamily(),
  ): Promise<NewFamilyResponse> =>
    api.post<NewFamilyResponse>(`/family/${groupId}`, familyDto, { token });

  const createMember = async (
    token: string,
    groupId: string,
    familyId: string,
    memberDataOverrides: Partial<ReturnType<typeof generateRandomMember>> = {},
  ): Promise<FamilyMemberData> => {
    const memberData = {
      ...generateRandomMember(familyId),
      ...memberDataOverrides,
    };
    const body = await api.post<FamilyMemberResponse>(
      `/family-member/${groupId}`,
      memberData,
      { token },
    );
    return body.data;
  };

  // ===========================================================================================
  // SETUP & TEARDOWN
  // ===========================================================================================

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      httpServer,
    } = await createTestApp({
      allExceptionsFilter: true,
    });

    app = testApp;
    prisma = testPrisma;
    api = new TestApi(httpServer, '/api');
  });

  afterAll(async () => {
    await prisma.relationship.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.groupFamily.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  afterEach(async () => {
    await prisma.relationship.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.groupFamily.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  // ===========================================================================================
  // CATEGORY 1: Basic CRUD (4 cases)
  // ===========================================================================================
  describe('Category 1: Basic CRUD', () => {
    it('1.1 should create a new PARENT relationship successfully', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const parent = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const child = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: parent.id,
          toMemberId: child.id,
          type: 'PARENT',
        },
      ];

      const body = await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 201 },
      );

      expect(body.data.count).toBe(1);
    });

    it('1.2 should get the relationship map for a family', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const parent = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const child = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        [
          {
            familyId: family.data.family.id,
            fromMemberId: parent.id,
            toMemberId: child.id,
            type: 'PARENT',
          },
        ],
        { token },
      );

      const body = await api.get<RelationshipMapResponse>(
        `/relationship/${group.data.id}/${family.data.family.id}`,
        { token, expect: 200 },
      );

      expect(body.data.generations).toHaveLength(1);
      const parentInMap = body.data.generations[0].members.find(
        (m) => m.id === parent.id,
      );
      expect(parentInMap!.children[0].id).toBe(child.id);
    });

    it('1.3 should update a relationship successfully', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        [
          {
            familyId: family.data.family.id,
            fromMemberId: member1.id,
            toMemberId: member2.id,
            type: 'PARENT',
          },
        ],
        { token },
      );

      const rels = await prisma.relationship.findMany();
      const relationshipId = rels[0].id;

      const body = await api.patch<RelationshipResponse>(
        `/relationship/${group.data.id}/${relationshipId}`,
        { type: 'SPOUSE' },
        { token, expect: 200 },
      );

      expect(body.data.id).toBe(relationshipId);
      expect(body.data.type).toBe('SPOUSE');
    });

    it('1.4 should delete a relationship successfully', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        [
          {
            familyId: family.data.family.id,
            fromMemberId: member1.id,
            toMemberId: member2.id,
            type: 'PARENT',
          },
        ],
        { token },
      );

      const rels = await prisma.relationship.findMany();
      const relationshipId = rels[0].id;

      await api.delete<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}/${family.data.family.id}/${relationshipId}`,
        { token, expect: 200 },
      );

      const findDeleted = await prisma.relationship.findUnique({
        where: { id: relationshipId },
      });
      expect(findDeleted).toBeNull();
    });
  });

  // ===========================================================================================
  // CATEGORY 2: Validation Logic (4 cases)
  // ===========================================================================================
  describe('Category 2: Validation Logic', () => {
    it('2.1 should fail to create a relationship with a non-existent fromMemberId', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: '00000000-0000-0000-0000-000000000000',
          toMemberId: member.id,
          type: 'PARENT',
        },
      ];

      await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );
    });

    it('2.2 should fail to create a self-referencing relationship', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: member.id,
          toMemberId: member.id,
          type: 'PARENT',
        },
      ];

      const body = await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );

      expect(body.message).toContain(
        'fromMemberId and toMemberId must be different',
      );
    });

    it('2.3 should fail to create a relationship with an invalid type enum', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: member1.id,
          toMemberId: member2.id,
          type: 'INVALID_TYPE',
        },
      ];

      await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );
    });

    it('2.4 should fail to create a relationship with a non-UUID familyId', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const member1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: 'not-a-uuid',
          fromMemberId: member1.id,
          toMemberId: member2.id,
          type: 'PARENT',
        },
      ];

      await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );
    });
  });

  // ===========================================================================================
  // CATEGORY 3: Business Logic & Integrity (4 cases)
  // ===========================================================================================
  describe('Category 3: Business Logic & Integrity', () => {
    it('3.1 should fail to create a third PARENT for a child', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const parent1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const parent2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const parent3 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const child = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      await prisma.relationship.createMany({
        data: [
          {
            familyId: family.data.family.id,
            fromMemberId: parent1.id,
            toMemberId: child.id,
            type: 'PARENT',
          },
          {
            familyId: family.data.family.id,
            fromMemberId: parent2.id,
            toMemberId: child.id,
            type: 'PARENT',
          },
        ],
      });

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: parent3.id,
          toMemberId: child.id,
          type: 'PARENT',
        },
      ];

      const body = await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );

      expect(body.message).toContain(
        'Business Logic Error: PARENT_LIMIT_EXCEEDED',
      );
    });

    it('3.2 should fail to create a second SPOUSE for a member', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const husband = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const wife1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const wife2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      await prisma.relationship.create({
        data: {
          familyId: family.data.family.id,
          fromMemberId: husband.id,
          toMemberId: wife1.id,
          type: 'SPOUSE',
        },
      });

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: husband.id,
          toMemberId: wife2.id,
          type: 'SPOUSE',
        },
      ];

      const body = await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );

      expect(body.message).toContain('Business Logic Error: SPOUSE_EXISTS');
    });

    it('3.3 should fail to create a circular PARENT relationship', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const memberA = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const memberB = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      // A is parent of B
      await prisma.relationship.create({
        data: {
          familyId: family.data.family.id,
          fromMemberId: memberA.id,
          toMemberId: memberB.id,
          type: 'PARENT',
        },
      });

      // Try to make B parent of A
      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: memberB.id,
          toMemberId: memberA.id,
          type: 'PARENT',
        },
      ];

      const body = await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 400 },
      );

      expect(body.message).toContain(
        'Business Logic Error: CIRCULAR_DEPENDENCY',
      );
    });

    it('3.4 should correctly handle a CHILD relationship type', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const parent = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const child = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: child.id,
          toMemberId: parent.id,
          type: 'CHILD',
        },
      ];

      await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 201 },
      );

      const body = await api.get<RelationshipMapResponse>(
        `/relationship/${group.data.id}/${family.data.family.id}`,
        { token, expect: 200 },
      );

      const parentInMap = body.data.generations[0].members.find(
        (m) => m.id === parent.id,
      );
      const childInMap = body.data.generations[0].members.find(
        (m) => m.id === child.id,
      );

      expect(parentInMap!.children[0].id).toBe(child.id);
      expect(childInMap!.parents[0].id).toBe(parent.id);
    });
  });

  // ===========================================================================================
  // CATEGORY 4: Security & Auth (4 cases)
  // ===========================================================================================
  describe('Category 4: Security & Auth', () => {
    it('4.1 should fail to create a relationship without a token', async () => {
      await api.post<ApiDataResponse<unknown>>(
        '/relationship/some-group-id',
        [],
        { expect: 401 },
      );
    });

    it('4.2 should fail to create a relationship as a VIEWER', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: viewerToken, userId: viewerId } = await registerAndLogin();

      const group = await createGroup(ownerToken);
      const family = await createFamily(ownerToken, group.data.id);
      const member1 = await createMember(
        ownerToken,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        ownerToken,
        group.data.id,
        family.data.family.id,
      );

      await prisma.groupMember.create({
        data: {
          groupId: group.data.id,
          memberId: viewerId,
          role: MEMBER_ROLE.VIEWER,
        },
      });

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: member1.id,
          toMemberId: member2.id,
          type: 'PARENT',
        },
      ];

      await api.post<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}`,
        payload,
        { token: viewerToken, expect: 403 },
      );
    });

    it('4.3 should fail to get relationships for a family in a group the user is not part of', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: outsiderToken } = await registerAndLogin();

      const group = await createGroup(ownerToken);
      const family = await createFamily(ownerToken, group.data.id);

      await api.get<RelationshipMapResponse>(
        `/relationship/${group.data.id}/${family.data.family.id}`,
        { token: outsiderToken, expect: 403 },
      );
    });

    it('4.4 should fail to delete a relationship as a VIEWER', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: viewerToken, userId: viewerId } = await registerAndLogin();
      const group = await createGroup(ownerToken);
      const family = await createFamily(ownerToken, group.data.id);
      const member1 = await createMember(
        ownerToken,
        group.data.id,
        family.data.family.id,
      );
      const member2 = await createMember(
        ownerToken,
        group.data.id,
        family.data.family.id,
      );

      const rel = await prisma.relationship.create({
        data: {
          familyId: family.data.family.id,
          fromMemberId: member1.id,
          toMemberId: member2.id,
          type: 'PARENT',
        },
      });

      await prisma.groupMember.create({
        data: {
          groupId: group.data.id,
          memberId: viewerId,
          role: MEMBER_ROLE.VIEWER,
        },
      });

      await api.delete<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}/${family.data.family.id}/${rel.id}`,
        { token: viewerToken, expect: 403 },
      );
    });
  });

  // ===========================================================================================
  // CATEGORY 5: Edge Cases (4 cases)
  // ===========================================================================================
  describe('Category 5: Edge Cases', () => {
    it('5.1 should create multiple relationships in a single batch request', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      const p1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const p2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const c1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: p1.id,
          toMemberId: p2.id,
          type: 'SPOUSE',
        },
        {
          familyId: family.data.family.id,
          fromMemberId: p1.id,
          toMemberId: c1.id,
          type: 'PARENT',
        },
        {
          familyId: family.data.family.id,
          fromMemberId: p2.id,
          toMemberId: c1.id,
          type: 'PARENT',
        },
      ];

      const body = await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        payload,
        { token, expect: 201 },
      );

      expect(body.data.count).toBe(3);
    });

    it('5.2 should get an empty map from a family with no relationships', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      await createMember(token, group.data.id, family.data.family.id);

      const body = await api.get<RelationshipMapResponse>(
        `/relationship/${group.data.id}/${family.data.family.id}`,
        { token, expect: 200 },
      );

      expect(body.data.generations[0].members[0].parents).toEqual([]);
      expect(body.data.generations[0].members[0].spouse).toBeNull();
      expect(body.data.generations[0].members[0].children).toEqual([]);
    });

    it('5.3 should fail to update a non-existent relationship', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await api.patch<ApiDataResponse<unknown>>(
        `/relationship/${group.data.id}/${nonExistentId}`,
        { type: 'SPOUSE' },
        { token, expect: 404 },
      );
    });

    it('5.4 should create a full family tree and verify the map structure', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);

      // Gen 1
      const gp = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const gm = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      // Gen 2
      const p1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );
      const p2 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      // Gen 3
      const c1 = await createMember(
        token,
        group.data.id,
        family.data.family.id,
      );

      const payload = [
        // Gen 1 marriage
        {
          familyId: family.data.family.id,
          fromMemberId: gp.id,
          toMemberId: gm.id,
          type: 'SPOUSE',
        },
        // Gen 1 -> Gen 2
        {
          familyId: family.data.family.id,
          fromMemberId: gp.id,
          toMemberId: p1.id,
          type: 'PARENT',
        },
        {
          familyId: family.data.family.id,
          fromMemberId: gm.id,
          toMemberId: p1.id,
          type: 'PARENT',
        },
        // Gen 2 marriage
        {
          familyId: family.data.family.id,
          fromMemberId: p1.id,
          toMemberId: p2.id,
          type: 'SPOUSE',
        },
        // Gen 2 -> Gen 3
        {
          familyId: family.data.family.id,
          fromMemberId: p1.id,
          toMemberId: c1.id,
          type: 'PARENT',
        },
        {
          familyId: family.data.family.id,
          fromMemberId: p2.id,
          toMemberId: c1.id,
          type: 'PARENT',
        },
      ];

      await api.post<RelationshipCreationResponse>(
        `/relationship/${group.data.id}`,
        payload,
        { token },
      );

      const body = await api.get<RelationshipMapResponse>(
        `/relationship/${group.data.id}/${family.data.family.id}`,
        { token, expect: 200 },
      );

      // This test assumes generation is set correctly on member creation.
      // A more robust test would not rely on the order of members in the array.
      const secondGen = body.data.generations[1].members;
      const p1InMap = secondGen.find((m) => m.id === p1.id);
      expect(p1InMap!.parents).toHaveLength(2);
      expect(p1InMap!.spouse).not.toBeNull();
      expect(p1InMap!.children).toHaveLength(1);
    });
  });
});
