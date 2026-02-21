import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../prisma/prisma.service';
import { MEMBER_ROLE, GENDER, TYPE_RELATIONSHIP } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Server } from 'http';

// ===========================================================================================
// INTERFACES
// ===========================================================================================

interface LoginResponse {
  data: {
    user: {
      id: string;
      email: string;
      userProfile: {
        fullName: string;
        avatar?: string;
      };
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  code: number;
}

interface GroupResponse {
  data: {
    id: string;
    name: string;
    description: string;
  };
  code: number;
}

interface FamilyResponse {
  data: {
    family: {
      id: string;
      name: string;
      description: string;
    };
    owner: {
      id: string;
      name: string;
      avatar: string;
    };
  };
  code: number;
}

interface FamilyMember {
  id: string;
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth: string;
  generation: number;
  isAlive: boolean;
  avatarUrl: string | null;
}

interface FamilyMemberResponse {
  data: FamilyMember;
  code: number;
}

interface Relationship {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: TYPE_RELATIONSHIP;
}

interface RelationshipResponse {
  data: Relationship;
  code: number;
}

interface RelationshipCreationResponse {
  data: {
    count: number;
  };
  code: number;
}

interface RelationshipMapResponse {
  data: {
    generations: {
      level: number;
      members: any[]; // This can be more strictly typed if needed
    }[];
  };
  code: number;
}

// ===========================================================================================
// FACTORIES
// ===========================================================================================

/**
 * Generates a random user object for testing.
 * @returns A user object with random data.
 */
export const generateRandomUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  fullName: faker.person.fullName(),
});

/**
 * Generates a random family object for testing.
 * @returns A family object with a random name and description.
 */
export const generateRandomFamily = () => ({
  name: faker.company.name(),
  description: faker.lorem.sentence(),
});

/**
 * Generates a random family member object for testing.
 * @param familyId - The ID of the family this member belongs to.
 * @returns A family member object with random data.
 */
export const generateRandomMember = (familyId: string) => ({
  familyId,
  fullName: faker.person.fullName(),
  gender: faker.helpers.arrayElement([
    GENDER.MALE,
    GENDER.FEMALE,
    GENDER.OTHER,
  ]),
  dateOfBirth: faker.date.past({ years: 50 }).toISOString(),
  dateOfDeath: null,
  isAlive: true,
  biography: faker.lorem.paragraph(),
  generation: faker.number.int({ min: 1, max: 5 }),
});

// ===========================================================================================
// TEST SUITE
// ===========================================================================================

describe('Relationships (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  // ===========================================================================================
  // HELPER FUNCTIONS
  // ===========================================================================================

  const registerAndLogin = async (
    userDto = generateRandomUser(),
  ): Promise<{ token: string; userId: string }> => {
    await request(httpServer).post('/api/auth/register').send(userDto);
    const loginRes = await request(httpServer)
      .post('/api/auth/login-base')
      .send({ email: userDto.email, password: userDto.password });
    const body = loginRes.body as LoginResponse;
    return {
      token: body.data.tokens.accessToken,
      userId: body.data.user.id,
    };
  };

  const createGroup = async (
    token: string,
    groupDto = { name: 'Test Group', description: 'A group for testing' },
  ): Promise<GroupResponse> => {
    const response = await request(httpServer)
      .post('/api/group-family')
      .set('Authorization', `Bearer ${token}`)
      .send(groupDto);
    return response.body as GroupResponse;
  };

  const createFamily = async (
    token: string,
    groupId: string,
    familyDto = generateRandomFamily(),
  ): Promise<FamilyResponse> => {
    const response = await request(httpServer)
      .post(`/api/family/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(familyDto);
    return response.body as FamilyResponse;
  };

  const createMember = async (
    token: string,
    groupId: string,
    familyId: string,
    memberDataOverrides: Partial<ReturnType<typeof generateRandomMember>> = {},
  ): Promise<FamilyMember> => {
    const memberData = {
      ...generateRandomMember(familyId),
      ...memberDataOverrides,
    };
    const response = await request(httpServer)
      .post(`/api/family-member/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);
    const body = response.body as FamilyMemberResponse;
    return body.data;
  };

  // ===========================================================================================
  // SETUP & TEARDOWN
  // ===========================================================================================

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    httpServer = app.getHttpServer();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.CREATED);
      const body = res.body as RelationshipCreationResponse;
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

      await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send([
          {
            familyId: family.data.family.id,
            fromMemberId: parent.id,
            toMemberId: child.id,
            type: 'PARENT',
          },
        ]);

      const res = await request(httpServer)
        .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.OK);
      const body = res.body as RelationshipMapResponse;
      expect(body.data.generations).toHaveLength(1);
      const parentInMap = body.data.generations[0].members.find(
        (m) => m.id === parent.id,
      );
      expect(parentInMap.children[0].id).toBe(child.id);
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

      await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send([
          {
            familyId: family.data.family.id,
            fromMemberId: member1.id,
            toMemberId: member2.id,
            type: 'PARENT',
          },
        ]);

      const rels = await prisma.relationship.findMany();
      const relationshipId = rels[0].id;

      const res = await request(httpServer)
        .patch(`/api/relationship/${group.data.id}/${relationshipId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'SPOUSE' });

      expect(res.status).toBe(HttpStatus.OK);
      const body = res.body as RelationshipResponse;
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

      await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send([
          {
            familyId: family.data.family.id,
            fromMemberId: member1.id,
            toMemberId: member2.id,
            type: 'PARENT',
          },
        ]);

      const rels = await prisma.relationship.findMany();
      const relationshipId = rels[0].id;

      const res = await request(httpServer)
        .delete(
          `/api/relationship/${group.data.id}/${family.data.family.id}/${relationshipId}`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.OK);

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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toContain(
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toContain(
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toContain('Business Logic Error: SPOUSE_EXISTS');
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toContain(
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

      const createRes = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(createRes.status).toBe(HttpStatus.CREATED);

      const mapRes = await request(httpServer)
        .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
        .set('Authorization', `Bearer ${token}`);

      const body = mapRes.body as RelationshipMapResponse;
      const parentInMap = body.data.generations[0].members.find(
        (m) => m.id === parent.id,
      );
      const childInMap = body.data.generations[0].members.find(
        (m) => m.id === child.id,
      );

      expect(parentInMap.children[0].id).toBe(child.id);
      expect(childInMap.parents[0].id).toBe(parent.id);
    });
  });

  // ===========================================================================================
  // CATEGORY 4: Security & Auth (4 cases)
  // ===========================================================================================
  describe('Category 4: Security & Auth', () => {
    it('4.1 should fail to create a relationship without a token', async () => {
      const res = await request(httpServer)
        .post('/api/relationship/some-group-id')
        .send([]);
      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
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
        data: { groupId: group.data.id, memberId: viewerId, role: 'VIEWER' },
      });

      const payload = [
        {
          familyId: family.data.family.id,
          fromMemberId: member1.id,
          toMemberId: member2.id,
          type: 'PARENT',
        },
      ];

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('4.3 should fail to get relationships for a family in a group the user is not part of', async () => {
      const { token: ownerToken } = await registerAndLogin();
      const { token: outsiderToken } = await registerAndLogin();

      const group = await createGroup(ownerToken);
      const family = await createFamily(ownerToken, group.data.id);

      const res = await request(httpServer)
        .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
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
        data: { groupId: group.data.id, memberId: viewerId, role: 'VIEWER' },
      });

      const res = await request(httpServer)
        .delete(
          `/api/relationship/${group.data.id}/${family.data.family.id}/${rel.id}`,
        )
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
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

      const res = await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(HttpStatus.CREATED);
      const body = res.body as RelationshipCreationResponse;
      expect(body.data.count).toBe(3);
    });

    it('5.2 should get an empty map from a family with no relationships', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const family = await createFamily(token, group.data.id);
      await createMember(token, group.data.id, family.data.family.id);

      const res = await request(httpServer)
        .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.OK);
      const body = res.body as RelationshipMapResponse;
      expect(body.data.generations[0].members[0].parents).toEqual([]);
      expect(body.data.generations[0].members[0].spouse).toBeNull();
      expect(body.data.generations[0].members[0].children).toEqual([]);
    });

    it('5.3 should fail to update a non-existent relationship', async () => {
      const { token } = await registerAndLogin();
      const group = await createGroup(token);
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const res = await request(httpServer)
        .patch(`/api/relationship/${group.data.id}/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'SPOUSE' });

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
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

      await request(httpServer)
        .post(`/api/relationship/${group.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const res = await request(httpServer)
        .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.OK);
      const body = res.body as RelationshipMapResponse;

      // This test assumes generation is set correctly on member creation.
      // A more robust test would not rely on the order of members in the array.
      const firstGen = body.data.generations[0].members;
      const secondGen = body.data.generations[1].members;
      const thirdGen = body.data.generations[2].members;

      // A simple check to see if relationships are linked
      const p1InMap = secondGen.find((m) => m.id === p1.id);
      expect(p1InMap.parents).toHaveLength(2);
      expect(p1InMap.spouse).not.toBeNull();
      expect(p1InMap.children).toHaveLength(1);
    });
  });
});
