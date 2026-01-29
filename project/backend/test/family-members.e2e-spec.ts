import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../prisma/prisma.service';
import { USER_ROLE } from '@prisma/client';
import {
  generateRandomUser,
  generateRandomFamily,
  generateRandomMember,
} from './factories';

import * as path from 'path';
import { Server } from 'http';
import * as fs from 'fs';
import { error } from 'console';

interface IUserType {
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

interface IGroupType {
  data: {
    id: string;
    name: string;
    description: string;
  };
  code: number;
}

interface INewFamily {
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

interface IFamilyMember {
  id: string;
  familyId: string;
  fullName: string;
  generation: string;
  isAlive: string;
  avatarUrl: string;
}

interface INewFamilyMember {
  data: IFamilyMember;
  code: number;
}

interface IGetFamilyMembers {
  data: IFamilyMember[];
  code: number;
}

interface RegisterDto {
  email: string;
  fullName: string;
  password?: string;
  isGoogle?: boolean;
}

interface LoginBaseDto {
  email: string;
  password?: string;
  isGoogle?: boolean;
}

interface FamilyDto {
  name: string;
  description?: string;
}

describe('Family Members (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  // Helper function to register a user
  const registerUser = async (userDto: RegisterDto): Promise<IUserType> => {
    const response = await request(httpServer)
      .post('/api/auth/register')
      .send(userDto);
    return response.body as IUserType;
  };

  // Helper function to log in a user
  const loginUser = async (credentials: LoginBaseDto): Promise<IUserType> => {
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

  // Helper function to create a family
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

  afterAll(async () => {
    // Manually clean up the database tables
    await prisma.relationship.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.album.deleteMany();
    await prisma.event.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.family.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.groupFamily.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  // ===========================================================================================
  // CATEGORY 1: Basic CRUD Operations (Happy Path)
  // ===========================================================================================

  it('1.1 should create a new family member successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(
      newUser.data.tokens.accessToken,
      groupData,
    );

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(
      newUser.data.tokens.accessToken,
      groupRes.data.id,
      familyData,
    );

    const memberData = generateRandomMember(familyRes.data.family.id);

    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${newUser.data.tokens.accessToken}`)
      .field('familyId', memberData.familyId)
      .field('fullName', memberData.fullName)
      .field('gender', memberData.gender)
      .field('dateOfBirth', memberData.dateOfBirth.toISOString())
      .field('generation', memberData.generation);

    expect(res.status).toBe(HttpStatus.CREATED);
    const responseBody: INewFamilyMember = res.body as INewFamilyMember;
    expect(responseBody.data.fullName).toBe(memberData.fullName);
    expect(responseBody.data.familyId).toBe(familyRes.data.family.id);
  });

  it('1.2 should get all family members for a specific family', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(
      newUser.data.tokens.accessToken,
      groupData,
    );

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(
      newUser.data.tokens.accessToken,
      groupRes.data.id,
      familyData,
    );
    // console.log(familyRes);

    // Create two members
    const memberOne = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${newUser.data.tokens.accessToken}`)
      .send(generateRandomMember(familyRes.data.family.id));
    // if (!memberOne) throw new error('member one can not init');
    const memberTwo = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${newUser.data.tokens.accessToken}`)
      .send(generateRandomMember(familyRes.data.family.id));
    if (!memberTwo) throw new error('member one can not init');
    console.log(memberOne);

    const res = await request(httpServer)
      .get(`/api/family-member/${familyRes.data.family.id}`)
      .set('Authorization', `Bearer ${newUser.data.tokens.accessToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    const responseBody: IGetFamilyMembers = res.body as IGetFamilyMembers;
    expect(responseBody.data).toBeInstanceOf(Array);
    expect(responseBody.data.length).toBe(2);
  });

  it('1.3 should get a specific family member by ID', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);
    //console.log('new family at 275:', familyRes);

    const memberData = generateRandomMember(familyRes.data.family.id);

    //create new family member
    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;

    //get family member detail (get one)
    const res = await request(httpServer)
      .get(`/api/family-member/${familyRes.data.family.id}/${member.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);
    const responseBody: INewFamilyMember = res.body as INewFamilyMember;
    console.log(responseBody);
    expect(responseBody.data.id).toBe(member.id);
    expect(responseBody.data.fullName).toBe(memberData.fullName);
  });

  it('1.4 should update a family member successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);
    console.log('group at 307:', groupRes);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);
    console.log('family at 311: ', familyRes);

    const memberData = generateRandomMember(familyRes.data.family.id);
    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;
    console.log('member at 320:', member);

    const updatedName = 'Jane Doe Updated';
    const res = await request(httpServer)
      .patch(
        `/api/family-member/${groupRes.data.id}/${familyRes.data.family.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ memberId: member.id, fullName: updatedName });

    expect(res.status).toBe(HttpStatus.OK);
    const responseBody: INewFamilyMember = res.body as INewFamilyMember;
    expect(responseBody.data.id).toBe(member.id);
    expect(responseBody.data.fullName).toBe(updatedName);
  });

  // ===========================================================================================
  // CATEGORY 2: Data Validation & Constraints
  // ===========================================================================================
  it('2.1 should fail to create a member with missing required fields (fullName)', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);
    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);
    delete memberData.fullName; // Remove required field

    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.2 should fail to create a member with an invalid gender', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);

    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...memberData, gender: 'INVALID_GENDER' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.3 should fail to update a member with an invalid date of birth format', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);
    console.log('group at 386: ', groupRes);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);
    console.log('family at 390: ', familyRes);

    const memberData = generateRandomMember(familyRes.data.family.id);
    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;
    console.log('member at 399: ', member);

    const res = await request(httpServer)
      .patch(`/api/family-member/${groupRes.data.id}/${member.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: member.id, dateOfBirth: 'not-a-date' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('2.4 should fail to create a member with a non-existent familyId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    await createFamily(token, groupRes.data.id, generateRandomFamily());

    const nonExistentFamilyId = '00000000-0000-0000-0000-000000000000';
    const memberData = generateRandomMember(nonExistentFamilyId);

    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}/${nonExistentFamilyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });
  // ===========================================================================================
  // CATEGORY 3: Relationship & Integrity
  // ===========================================================================================

  it('3.1 should not get members from a family the user does not belong to', async () => {
    const userAData = generateRandomUser();
    const newUserA = await registerUser(userAData);
    const tokenA = newUserA.data.tokens.accessToken;

    const groupAData = { name: 'Group A', description: 'Group A Desc' };
    const groupARes = await createGroup(tokenA, groupAData);

    const familyAData = generateRandomFamily();
    const familyARes = await createFamily(
      tokenA,
      groupARes.data.id,
      familyAData,
    );
    const familyA = familyARes.data.family;

    // User B
    const userBData = generateRandomUser();
    const newUserB = await registerUser(userBData);

    const tokenB = newUserB.data.tokens.accessToken;

    // User B tries to get members from User A's family
    const res = await request(httpServer)
      .get(`/api/family-member/${familyA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    console.log(res.body);

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('3.2 should not add a member to a family using a wrong group id in params', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);

    const wrongGroupId = '00000000-0000-0000-0000-000000000000';
    const res = await request(httpServer)
      .post(`/api/family-member/${wrongGroupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('3.3 should successfully delete a family member as owner', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);

    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;

    const res = await request(httpServer)
      .delete(
        `/api/family-member/${groupRes.data.id}/${familyRes.data.family.id}/${member.id}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);

    // Verify it's gone
    const getRes = await request(httpServer)
      .get(`/api/family-member/${familyRes.data.family.id}/${member.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('3.4 should create a member with an avatar successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);

    const imagePath = path.join(__dirname, '..', 'test', '1099451.jpg');
    // Ensure the test file exists
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found at:', imagePath);
      throw new Error('Test image not found');
    }

    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('familyId', memberData.familyId)
      .field('fullName', memberData.fullName)
      .field('gender', memberData.gender)
      .field('dateOfBirth', memberData.dateOfBirth.toISOString())
      .field('generation', memberData.generation)
      .attach('avatar', imagePath);

    expect(res.status).toBe(HttpStatus.CREATED);
    const responseBody: INewFamilyMember = res.body as IFamilyMember;
    expect(responseBody.data.avatarUrl).not.toBeNull();
    expect(responseBody.data.avatarUrl).toContain('cloudinary');
  });

  // ===========================================================================================
  // CATEGORY 4: Authentication & Authorization
  // ===========================================================================================

  it('4.1 should fail to create a member without a valid JWT token', async () => {
    const res = await request(httpServer)
      .post('/api/family-member/some-group-id')
      .send({});
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('4.2 should fail to get members without a valid JWT token', async () => {
    const res = await request(httpServer).get(
      '/api/family-member/some-family-id',
    );
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('4.3 should fail to update a member as a VIEWER', async () => {
    // User A (Owner)
    const ownerData = generateRandomUser();
    const newOwner = await registerUser(ownerData);

    const ownerToken = newOwner.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(ownerToken, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(
      ownerToken,
      groupRes.data.id,
      familyData,
    );

    // Create member
    const memberData = generateRandomMember(familyRes.data.family.id);
    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;

    // User B (Viewer)
    const viewerData = generateRandomUser();
    const newViewer = await registerUser(viewerData);

    const viewerToken = newViewer.data.tokens.accessToken;
    const viewerId = newViewer.data.user.id;

    // Owner invites viewer
    await prisma.groupMember.create({
      data: {
        memberId: viewerId,
        groupId: groupRes.data.id,
        role: USER_ROLE.VIEWER,
      },
    });

    // Viewer tries to update
    const res = await request(httpServer)
      .patch(
        `/api/family-member/${groupRes.data.id}/${familyRes.data.family.id}`,
      )
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ id: member.id, fullName: 'New Name From Viewer' });

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('4.4 should fail to delete a member as a VIEWER', async () => {
    // User A (Owner)
    const ownerData = generateRandomUser();
    const newOwner = await registerUser(ownerData);

    const ownerToken = newOwner.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(ownerToken, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(
      ownerToken,
      groupRes.data.id,
      familyData,
    );

    // Create member
    const memberData = generateRandomMember(familyRes.data.family.id);
    const createRes = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(memberData);
    const memberBody: INewFamilyMember = createRes.body as INewFamilyMember;
    const member = memberBody.data;

    // User B (Viewer)
    const viewerData = generateRandomUser();
    const newViewer = await registerUser(viewerData);

    const viewerToken = newViewer.data.tokens.accessToken;
    const viewerId = newViewer.data.user.id;

    // Owner invites viewer
    await prisma.groupMember.create({
      data: {
        memberId: viewerId, // Hoặc userId tùy theo Schema của bạn
        groupId: groupRes.data.id,
        role: 'VIEWER',
      },
    });

    // Viewer tries to delete
    const res = await request(httpServer)
      .delete(`/api/family-member/${familyRes.data.family.id}/${member.id}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ===========================================================================================
  // CATEGORY 5: Edge Cases & Business Logic
  // ===========================================================================================
  it('5.1 should return an empty array when getting members from a family with no members', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const res = await request(httpServer)
      .get(`/api/family-member/${familyRes.data.family.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(HttpStatus.OK);
    const responseBody: IGetFamilyMembers = res.body as IGetFamilyMembers;
    expect(responseBody.data).toEqual([]);
  });

  it('5.2 should fail to get a member with a non-UUID memberId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const res = await request(httpServer)
      .get(`/api/family-member/${familyRes.data.family.id}/not-a-uuid`)
      .set('Authorization', `Bearer ${token}`);

    // This will be caught by AllExceptionsFilter and returned as a generic error
    // because no specific pipe is on the param in the controller
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('5.3 should fail to update a non-existent member', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    await createFamily(token, groupRes.data.id, generateRandomFamily());

    const nonExistentMemberId = '00000000-0000-0000-0000-000000000000';

    const res = await request(httpServer)
      .patch(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: nonExistentMemberId, fullName: 'Ghost' });

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('5.4 should allow a user with EDITOR role to create a member', async () => {
    // User A (Owner)
    const ownerData = generateRandomUser();
    const newOwner = await registerUser(ownerData);

    const ownerToken = newOwner.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(ownerToken, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(
      ownerToken,
      groupRes.data.id,
      familyData,
    );

    // User B (Editor)
    const editorData = generateRandomUser();
    const newEditor = await registerUser(editorData);

    const editorToken = newEditor.data.tokens.accessToken;
    const editorId = newEditor.data.user.id;

    // Owner makes User B an editor
    await prisma.groupMember.create({
      data: {
        memberId: editorId,
        groupId: groupRes.data.id,
        role: USER_ROLE.EDITOR,
      },
    });

    const memberData = generateRandomMember(familyRes.data.family.id);

    // Editor creates member
    const res = await request(httpServer)
      .post(`/api/family-member/${groupRes.data.id}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send(memberData);

    expect(res.status).toBe(HttpStatus.CREATED);
    const responseBody: INewFamilyMember = res.body as INewFamilyMember;
    expect(responseBody.data.fullName).toBe(memberData.fullName);
  });
});
