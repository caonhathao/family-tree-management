import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../prisma/prisma.service';
import {
  GENDER,
  GroupFamily,
  TYPE_RELATIONSHIP,
  USER_ROLE,
} from '@prisma/client';
import { Server } from 'http';
import { faker } from '@faker-js/faker';

// ===========================================================================================
// INTERFACES
// ===========================================================================================

interface IUserType {
  data: {
    user: {
      id: string;
      email: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

interface IGroupType {
  data: {
    id: string;
    name: string;
  };
}

interface INewFamily {
  data: {
    family: {
      id: string;
      name: string;
    };
  };
}

interface IFamilyMember {
  id: string;
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth: string;
  generation: number;
}

interface INewFamilyMember {
  data: IFamilyMember;
}

interface IRelationship {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: TYPE_RELATIONSHIP;
}

interface IRelationshipResponse {
  data: IRelationship;
}

interface IMemberWithRelationships extends IFamilyMember {
  spouse: IFamilyMember | null;
  children: IFamilyMember[];
  parents: IFamilyMember[];
}

interface IGeneration {
  level: number;
  members: IMemberWithRelationships[];
}

interface IGetRelationshipMapResponse {
  data: {
    generations: IGeneration[];
  };
}

// ===========================================================================================
// DTOs & FACTORIES
// ===========================================================================================

interface RegisterDto {
  email: string;
  fullName: string;
  password?: string;
}

interface LoginDto {
  email: string;
  password?: string;
}

interface FamilyDto {
  name: string;
  description?: string;
}

interface CreateMemberDto {
  familyId: string;
  fullName: string;
  gender: GENDER;
  dateOfBirth: Date;
  generation: number;
}

const generateRandomUser = (): RegisterDto => ({
  email: faker.internet.email().toLowerCase(),
  fullName: faker.person.fullName(),
  password: 'password123',
});

const generateRandomFamily = (): FamilyDto => ({
  name: `${faker.company.name()} ${faker.string.uuid()}`,
  description: faker.lorem.sentence(),
});

const generateRandomMember = (familyId: string): CreateMemberDto => ({
  familyId,
  fullName: faker.person.fullName(),
  gender: faker.helpers.arrayElement([GENDER.MALE, GENDER.FEMALE]),
  dateOfBirth: faker.date.past(10),
  generation: 1,
});

// ===========================================================================================
// E2E TEST SUITE
// ===========================================================================================

describe('Relationships (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  // ===========================================================================================
  // HELPER FUNCTIONS
  // ===========================================================================================

  const registerUser = async (userDto: RegisterDto): Promise<IUserType> => {
    const response = await request(httpServer)
      .post('/api/auth/register')
      .send(userDto);
    return response.body as IUserType;
  };

  const loginUser = async (credentials: LoginDto): Promise<IUserType> => {
    const response = await request(httpServer)
      .post('/api/auth/login-base')
      .send(credentials);
    return response.body as IUserType;
  };

  const createGroup = async (
    token: string,
    groupDto: { name: string; description: string },
  ): Promise<IGroupType> => {
    const response = await request(httpServer)
      .post('/api/group-family')
      .set('Authorization', `Bearer ${token}`)
      .send(groupDto);
    return response.body as IGroupType;
  };

  const createFamily = async (
    token: string,
    groupId: string,
    familyDto: FamilyDto,
  ): Promise<INewFamily> => {
    const response = await request(httpServer)
      .post(`/api/family/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(familyDto);
    return response.body as INewFamily;
  };

  const createMember = async (
    token: string,
    groupId: string,
    memberDto: CreateMemberDto,
  ): Promise<INewFamilyMember> => {
    const response = await request(httpServer)
      .post(`/api/family-member/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...memberDto,
        dateOfBirth: memberDto.dateOfBirth.toISOString(),
      });
    return response.body as INewFamilyMember;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  beforeEach(async () => {
    await prisma.relationship.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.groupFamily.deleteMany();
    await prisma.user.deleteMany();
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
    await prisma.user.deleteMany();
  });

  // ===========================================================================================
  // CATEGORY 1: Basic CRUD Operations
  // ===========================================================================================

  it('1.1 should create a new relationship successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    const body: IRelationshipResponse = res.body;
    expect(body.data.fromMemberId).toBe(member1.data.id);
    expect(body.data.toMemberId).toBe(member2.data.id);
    expect(body.data.type).toBe(TYPE_RELATIONSHIP.SPOUSE);
  });

  it('1.2 should get all relationships for a family', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    const res = await request(httpServer)
      .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body: IGetRelationshipMapResponse = res.body;

    expect(body.data.generations).toHaveLength(1);
    expect(body.data.generations[0].level).toBe(1);
    expect(body.data.generations[0].members).toHaveLength(2);

    const member1WithRels = body.data.generations[0].members.find(
      (m) => m.id === member1.data.id,
    );
    const member2WithRels = body.data.generations[0].members.find(
      (m) => m.id === member2.data.id,
    );

    expect(member1WithRels?.spouse?.id).toBe(member2.data.id);
    expect(member2WithRels?.spouse?.id).toBe(member1.data.id);
  });

  it('1.3 should update a relationship successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member3 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = createRes.body.data.id;

    const res = await request(httpServer)
      .patch(`/api/relationship/${group.data.id}/${relationshipId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        toMemberId: member3.data.id,
        fromMemberId: member1.data.id,
        type: TYPE_RELATIONSHIP.PARENT,
      });

    expect(res.status).toBe(HttpStatus.OK);
    const body: IRelationshipResponse = res.body;
    expect(body.data.id).toBe(relationshipId);
    expect(body.data.toMemberId).toBe(member3.data.id);
    expect(body.data.type).toBe(TYPE_RELATIONSHIP.PARENT);
  });

  it('1.4 should delete a relationship successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = createRes.body.data.id;

    const res = await request(httpServer)
      .delete(
        `/api/relationship/${group.data.id}/${family.data.family.id}/${relationshipId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);

    const getRes = await request(httpServer)
      .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
      .set('Authorization', `Bearer ${token}`);
    const body: IGetRelationshipMapResponse = getRes.body;
    const member1WithRels = body.data.generations[0]?.members.find(
      (m) => m.id === member1.data.id,
    );
    expect(member1WithRels?.spouse).toBe(null);
  });

  // ===========================================================================================
  // CATEGORY 2: Validation Logic
  // ===========================================================================================

  it('2.1 should fail to create a relationship with a missing fromMemberId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.2 should fail to create a relationship with an invalid type', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: 'INVALID_TYPE',
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.3 should fail to create a relationship with a non-existent familyId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const nonExistentFamilyId = '00000000-0000-0000-0000-000000000000';

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: nonExistentFamilyId,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.4 should fail to update a relationship with an invalid type', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = createRes.body.data.id;

    const res = await request(httpServer)
      .patch(`/api/relationship/${group.data.id}/${relationshipId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        type: 'INVALID_TYPE',
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  // ===========================================================================================
  // CATEGORY 3: Business Logic & Integrity
  // ===========================================================================================

  it('3.1 should currently succeed in creating a self-referencing relationship (BUG)', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member1.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('3.2 should currently succeed in creating a duplicate relationship (BUG)', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('3.3 should currently succeed in creating a relationship with members from different families (BUG)', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group1 = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family1 = await createFamily(
      token,
      group1.data.id,
      generateRandomFamily(),
    );
    const group2 = await createGroup(token, {
      name: 'group-two',
      description: 'description-two',
    });
    const family2 = await createFamily(
      token,
      group2.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group1.data.id,
      generateRandomMember(family1.data.family.id),
    );
    const member2 = await createMember(
      token,
      group2.data.id,
      generateRandomMember(family2.data.family.id),
    );

    const res = await request(httpServer)
      .post(`/api/relationship/${group1.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family1.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('3.4 should currently succeed in updating a relationship to create a self-reference (BUG)', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = (createRes.body as IRelationshipResponse).data.id;

    const res = await request(httpServer)
      .patch(`/api/relationship/${group.data.id}/${relationshipId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        toMemberId: member1.data.id,
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  // ===========================================================================================
  // CATEGORY 4: Security & Auth
  // ===========================================================================================

  it('4.1 should fail to create a relationship without an auth token', async () => {
    const res = await request(httpServer)
      .post('/api/relationship/some-group-id')
      .send({});

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('4.2 should fail to get relationships for a family the user does not belong to', async () => {
    const userAData = generateRandomUser();
    const userA = await registerUser(userAData);
    const tokenA = userA.data.tokens.accessToken;
    const groupA = await createGroup(tokenA, {
      name: 'group-a',
      description: 'description-a',
    });
    const familyA = await createFamily(
      tokenA,
      groupA.data.id,
      generateRandomFamily(),
    );

    const userBData = generateRandomUser();
    const userB = await registerUser(userBData);
    const tokenB = userB.data.tokens.accessToken;

    const res = await request(httpServer)
      .get(`/api/relationship/${groupA.data.id}/${familyA.data.family.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('4.3 should fail to update a relationship as a VIEWER', async () => {
    const ownerData = generateRandomUser();
    const owner = await registerUser(ownerData);
    const ownerToken = owner.data.tokens.accessToken;

    const group = await createGroup(ownerToken, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      ownerToken,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = createRes.body.data.id;

    const viewerData = generateRandomUser();
    const viewer = await registerUser(viewerData);
    const viewerToken = viewer.data.tokens.accessToken;

    await prisma.groupMember.create({
      data: {
        groupId: group.data.id,
        memberId: viewer.data.user.id,
        role: USER_ROLE.VIEWER,
      },
    });

    const res = await request(httpServer)
      .patch(`/api/relationship/${group.data.id}/${relationshipId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        familyId: family.data.family.id,
        type: TYPE_RELATIONSHIP.PARENT,
      });

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('4.4 should fail to delete a relationship in a group the user is not a member of', async () => {
    const ownerData = generateRandomUser();
    const owner = await registerUser(ownerData);
    const ownerToken = owner.data.tokens.accessToken;

    const group = await createGroup(ownerToken, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      ownerToken,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const createRes = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });
    const relationshipId = (createRes.body as IRelationshipResponse).data.id;

    const otherUserData = generateRandomUser();
    const otherUser = await registerUser(otherUserData);
    const otherToken = otherUser.data.tokens.accessToken;

    const res = await request(httpServer)
      .delete(
        `/api/relationship/${group.data.id}/${family.data.family.id}/${relationshipId}`,
      )
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  // ===========================================================================================
  // CATEGORY 5: Edge Cases
  // ===========================================================================================

  it('5.1 should return an empty generation array when getting relationships from a family with no members', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );

    const res = await request(httpServer)
      .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);
    const body: IGetRelationshipMapResponse =
      res.body as IGetRelationshipMapResponse;
    expect(body.data.generations).toEqual([]);
  });

  it('5.2 should fail to delete a non-existent relationship', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const nonExistentRelationshipId = '00000000-0000-0000-0000-000000000000';

    const res = await request(httpServer)
      .delete(
        `/api/relationship/${group.data.id}/${family.data.family.id}/${nonExistentRelationshipId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('5.3 should succeed in creating a relationship as an EDITOR', async () => {
    const ownerData = generateRandomUser();
    const owner = await registerUser(ownerData);
    const ownerToken = owner.data.tokens.accessToken;

    const group = await createGroup(ownerToken, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      ownerToken,
      group.data.id,
      generateRandomFamily(),
    );
    const member1 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const member2 = await createMember(
      ownerToken,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );

    const editorData = generateRandomUser();
    const editor = await registerUser(editorData);
    const editorToken = editor.data.tokens.accessToken;

    await prisma.groupMember.create({
      data: {
        groupId: group.data.id,
        memberId: editor.data.user.id,
        role: USER_ROLE.EDITOR,
      },
    });

    const res = await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: member1.data.id,
        toMemberId: member2.data.id,
        type: TYPE_RELATIONSHIP.SPOUSE,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('5.4 should create one way PARENT-CHILD relationships', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;
    const group = await createGroup(token, {
      name: 'group-one',
      description: 'description-one',
    });
    const family = await createFamily(
      token,
      group.data.id,
      generateRandomFamily(),
    );
    const parent = await createMember(
      token,
      group.data.id,
      generateRandomMember(family.data.family.id),
    );
    const child = await createMember(token, group.data.id, {
      ...generateRandomMember(family.data.family.id),
      generation: 2,
    });

    // Parent -> Child
    await request(httpServer)
      .post(`/api/relationship/${group.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyId: family.data.family.id,
        fromMemberId: parent.data.id,
        toMemberId: child.data.id,
        type: TYPE_RELATIONSHIP.PARENT,
      });

    const getRes = await request(httpServer)
      .get(`/api/relationship/${group.data.id}/${family.data.family.id}`)
      .set('Authorization', `Bearer ${token}`);
    const body: IGetRelationshipMapResponse =
      getRes.body as IGetRelationshipMapResponse;

    // console.log(body.data);

    const parentMember = body.data.generations[0]?.members.find(
      (m) => m.id === parent.data.id,
    );
    const childMember = body.data.generations[1]?.members.find(
      (m) => m.id === child.data.id,
    );

    expect(parentMember?.children).toHaveLength(1);
    expect(parentMember?.children?.[0]?.id).toBe(child.data.id);
    expect(childMember?.parents).toHaveLength(1);
    expect(childMember?.parents?.[0]?.id).toBe(parent.data.id);
  });
});
