import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';

interface newFamily {
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

interface userType {
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

interface newGroup {
  data: {
    id: string;
    name: string;
    description: string;
  };
  code: number;
}

interface updateFamilyType {
  data: {
    id: string;
    name: string;
    description: string;
  };
  code: number;
}

interface getFamily {
  data: {
    id: string;
    name: string;
    description: string;
    owner: {
      id: string;
      userProfile: {
        fullName: string;
        avatar: string;
      };
    };

    _count: {
      familyMembers: number;
      albums: number;
      events: number;
      activityLogs: number;
    };
  };
  code: number;
}

interface deleteFamily {
  data: { id: string };
  code: number;
}

interface inviteType {
  data: {
    inviteLink: string;
  };
  code: number;
}

interface joinUserType {
  data: {
    id: string;
    groupId: string;
    memberId: string;
    role: string;
    isLeader: string;
  };
  code: number;
}

describe('Family E2E Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true, // Tự động convert kiểu dữ liệu
      }),
    );

    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    baseUrl = app.getHttpServer();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    await app.close();
  });

  const generateSuffix = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const registerUser = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const response = await request(baseUrl).post('/api/auth/register').send({
      email,
      password,
      fullName,
    });

    if (response.status !== 201) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //console.dir(response.body, { depth: null });
    }
    return response.body as userType;
  };

  const loginUser = async (email: string, password: string) => {
    const response = await request(baseUrl).post('/api/auth/login-base').send({
      email,
      password,
    });
    if (response.status !== 200) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //console.dir(response.body, { depth: null });
    }
    return response.body as userType;
  };

  const createGroup = async (token: string, name: string) => {
    const response = await request(baseUrl)
      .post('/api/group-family')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        description: 'Test group description',
      });
    if (response.status !== 201) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //console.dir(response.body, { depth: null });
    }
    return response.body as newGroup;
  };

  const createFamily = async (
    token: string,
    groupId: string,
    name: string,
    description: string,
  ) => {
    const response = await request(baseUrl)
      .post(`/api/family/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        description,
      });
    if (response.status !== 201) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //console.dir(response.body, { depth: null });
    }
    return response.body as newFamily;
  };

  const getFamily = async (token: string, familyId: string) => {
    const response = await request(baseUrl)
      .get(`/api/family/${familyId}`)
      .set('Authorization', `Bearer ${token}`);
    if (response.status !== 200) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      // console.dir(getRes.body, { depth: null });
    }
    return response.body as getFamily;
  };

  const updateFamily = async (
    token: string,
    groupId: string,
    familyId: string,
    name: string,
    description: string,
  ) => {
    const response = await request(baseUrl)
      .patch(`/api/family/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: familyId,
        name: name,
        description: description,
      });
    if (response.status !== 200) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      // console.dir(updateRes.body, { depth: null });
    }
    console.log(response.body);
    return response.body as updateFamilyType;
  };

  const deleteFamily = async (
    token: string,
    groupId: string,
    familyId: string,
  ) => {
    const response = await request(baseUrl)
      .delete(`/api/family/${groupId}/${familyId}`)
      .set('Authorization', `Bearer ${token}`);

    if (response.status !== 200) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //   console.dir(deleteRes.body, { depth: null });
    }
    return response.body as deleteFamily;
  };

  const generateInviteCode = async (token: string, groupId: string) => {
    const response = await request(baseUrl)
      .post('/api/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: groupId,
      });

    // console.log('res: ', response);
    if (response.status !== 201) {
      console.error(`FAILED AT ${expect.getState().currentTestName}`);
      //console.dir(response.body, { depth: null });
    }
    return response.body as inviteType;
  };

  describe('FAMILY-01: Happy Path - Create Family', () => {
    it('should create family successfully with fresh user and group', async () => {
      const suffix = generateSuffix();
      const email = `family01-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      console.log('register at 183:', registerRes);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);

      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);

      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );

      expect(familyRes.code).toBe(201);
      expect(familyRes.data.family.name).toBe(familyName);
      expect(familyRes.data.family.description).toBe(familyDescription);
    });
  });

  describe('FAMILY-02: Happy Path - Update Family', () => {
    it('should update family successfully', async () => {
      const suffix = generateSuffix();
      const email = `family02-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const updatedFamilyName = `Updated-${suffix}`;
      const familyDescription = `Description-${suffix}`;
      const updatedDescription = `Updated-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );
      expect(familyRes.code).toBe(201);

      console.log('token: ', token);
      console.log('groupId: ', groupId);
      const updateRes = await updateFamily(
        token,
        groupId,
        familyRes.data.family.id,
        updatedFamilyName,
        updatedDescription,
      );

      expect(updateRes.code).toBe(200);
      expect(updateRes.data.name).toBe(updatedFamilyName);
      expect(updateRes.data.description).toBe(updatedDescription);
    });
  });

  describe('FAMILY-03: Happy Path - Get Family', () => {
    it('should get family successfully', async () => {
      const suffix = generateSuffix();
      const email = `family03-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );
      expect(familyRes.code).toBe(201);
      const familyId = familyRes.data.family.id;

      const getRes = await getFamily(token, familyId);

      expect(getRes.code).toBe(200);
      expect(getRes.data.name).toBe(familyName);
      expect(getRes.data.description).toBe(familyDescription);
    });
  });

  describe('FAMILY-04: Happy Path - Delete Family', () => {
    it('should delete family successfully', async () => {
      const suffix = generateSuffix();
      const email = `family04-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );
      expect(familyRes.code).toBe(201);
      const familyId = familyRes.data.family.id;

      const deleteRes = await deleteFamily(token, groupId, familyId);

      expect(deleteRes.code).toBe(200);
    });
  });

  describe('FAMILY-05: Happy Path - Complete Family Lifecycle', () => {
    it('should handle complete family lifecycle', async () => {
      const suffix = generateSuffix();
      const email = `family05-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;
      const updatedName = `Updated-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const createRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );
      expect(createRes.code).toBe(201);
      const familyId = createRes.data.family.id;

      const getRes = await getFamily(token, familyId);
      expect(getRes.code).toBe(200);

      const updateRes = await updateFamily(
        token,
        groupId,
        getRes.data.id,
        updatedName,
        familyDescription,
      );
      expect(updateRes.code).toBe(200);

      const deleteRes = await deleteFamily(token, groupId, familyId);

      expect(deleteRes.code).toBe(200);
    });
  });

  describe('FAMILY-06: Role Enforcement - Owner Create Family', () => {
    it('should allow owner to create family', async () => {
      const suffix = generateSuffix();
      const email = `family06-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );

      expect(familyRes.code).toBe(201);
    });
  });

  describe('FAMILY-07: Role Enforcement - Invite Joiner Cannot Create Family', () => {
    it('should deny user who joined via invite from creating family', async () => {
      const suffix = generateSuffix();
      const ownerEmail = `owner07-${suffix}@example.com`;
      const joinerEmail = `editor07-${suffix}@example.com`;
      const password = 'Password123!';
      const ownerName = `ownerName-${suffix}`;
      const joinerName = `editorName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const ownerRegisterRes = await registerUser(
        ownerEmail,
        password,
        ownerName,
      );
      expect(ownerRegisterRes.code).toBe(201);

      const ownerLoginRes = await loginUser(ownerEmail, password);
      expect(ownerLoginRes.code).toBe(200);
      const ownerToken = ownerLoginRes.data.tokens.accessToken;

      const groupRes = await createGroup(ownerToken, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const joinerRegisterRes = await registerUser(
        joinerEmail,
        password,
        joinerName,
      );
      expect(joinerRegisterRes.code).toBe(201);

      const joinerLoginRes = await loginUser(joinerEmail, password);
      expect(joinerLoginRes.code).toBe(200);
      const joinerToken = joinerLoginRes.data.tokens.accessToken;

      const inviteRes = await generateInviteCode(ownerToken, groupId);
      expect(inviteRes.code).toBe(201);

      const joinRes = await request(baseUrl)
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${joinerToken}`)
        .query({ token: inviteRes.data.inviteLink.split('token=')[1] });

      expect((joinRes.body as joinUserType).code).toBe(200);

      const familyRes = await createFamily(
        joinerToken,
        groupId,
        familyName,
        familyDescription,
      );
      console.log('at 556: ', familyRes);

      expect(familyRes.code).toBe(403);
    });
  });

  describe('FAMILY-08: Role Enforcement - Viewer Cannot Create Family', () => {
    it('should deny viewer from creating family', async () => {
      const suffix = generateSuffix();
      const ownerEmail = `owner08-${suffix}@example.com`;
      const viewerEmail = `viewer08-${suffix}@example.com`;
      const password = 'Password123!';
      const ownerName = `ownerName-${suffix}`;
      const viewerName = `viewerName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const ownerRegisterRes = await registerUser(
        ownerEmail,
        password,
        ownerName,
      );
      expect(ownerRegisterRes.code).toBe(201);

      const ownerLoginRes = await loginUser(ownerEmail, password);
      expect(ownerLoginRes.code).toBe(200);
      const ownerToken = ownerLoginRes.data.tokens.accessToken;

      const groupRes = await createGroup(ownerToken, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const viewerRegisterRes = await registerUser(
        viewerEmail,
        password,
        viewerName,
      );
      expect(viewerRegisterRes.code).toBe(201);

      const viewerLoginRes = await loginUser(viewerEmail, password);
      expect(viewerLoginRes.code).toBe(200);
      const viewerToken = viewerLoginRes.data.tokens.accessToken;

      const inviteRes = await generateInviteCode(ownerToken, groupId);
      expect(inviteRes.code).toBe(201);

      const joinRes = await request(baseUrl)
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ token: inviteRes.data.inviteLink.split('token=')[1] });

      expect((joinRes.body as joinUserType).code).toBe(200);

      const familyRes = await createFamily(
        viewerToken,
        groupId,
        familyName,
        familyDescription,
      );
      if (familyRes.code !== 403) {
        console.error(`FAILED AT ${expect.getState().currentTestName}`);
        console.dir(familyRes, { depth: null });
      }
      expect(familyRes.code).toBe(403);
    });
  });

  describe('FAMILY-09: Role Enforcement - Member Cannot Create Family', () => {
    it('should deny regular member from creating family', async () => {
      const suffix = generateSuffix();
      const ownerEmail = `owner09-${suffix}@example.com`;
      const memberEmail = `member09-${suffix}@example.com`;
      const password = 'Password123!';
      const ownerName = `ownerName-${suffix}`;
      const memberName = `memberName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const ownerRegisterRes = await registerUser(
        ownerEmail,
        password,
        ownerName,
      );
      expect(ownerRegisterRes.code).toBe(201);

      const ownerLoginRes = await loginUser(ownerEmail, password);
      expect(ownerLoginRes.code).toBe(200);
      const ownerToken = ownerLoginRes.data.tokens.accessToken;

      const groupRes = await createGroup(ownerToken, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const memberRegisterRes = await registerUser(
        memberEmail,
        password,
        memberName,
      );
      expect(memberRegisterRes.code).toBe(201);

      const memberLoginRes = await loginUser(memberEmail, password);
      expect(memberLoginRes.code).toBe(200);
      const memberToken = memberLoginRes.data.tokens.accessToken;

      const inviteRes = await generateInviteCode(ownerToken, groupId);
      expect(inviteRes.code).toBe(201);

      const joinRes = await request(baseUrl)
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ token: inviteRes.data.inviteLink.split('token=')[1] });
      expect((joinRes.body as joinUserType).code).toBe(200);

      const familyRes = await createFamily(
        memberToken,
        groupId,
        familyName,
        familyDescription,
      );
      if (familyRes.code !== 403) {
        console.error(`FAILED AT ${expect.getState().currentTestName}`);
        console.dir(familyRes, { depth: null });
      }
      expect(familyRes.code).toBe(403);
    });
  });

  describe('FAMILY-10: Role Enforcement - Viewer Cannot Update Family', () => {
    it('should deny viewer from updating family', async () => {
      const suffix = generateSuffix();
      const ownerEmail = `owner10-${suffix}@example.com`;
      const viewerEmail = `viewer10-${suffix}@example.com`;
      const password = 'Password123!';
      const ownerName = `ownerName-${suffix}`;
      const viewerName = `viewerName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;
      const updatedName = `Updated-${suffix}`;

      const ownerRegisterRes = await registerUser(
        ownerEmail,
        password,
        ownerName,
      );
      expect(ownerRegisterRes.code).toBe(201);

      const ownerLoginRes = await loginUser(ownerEmail, password);
      expect(ownerLoginRes.code).toBe(200);
      const ownerToken = ownerLoginRes.data.tokens.accessToken;

      const groupRes = await createGroup(ownerToken, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        ownerToken,
        groupId,
        familyName,
        familyDescription,
      );
      if (familyRes.code !== 201) {
        console.error(`FAILED AT ${expect.getState().currentTestName}`);
        console.dir(familyRes, { depth: null });
      }
      expect(familyRes.code).toBe(201);

      const viewerRegisterRes = await registerUser(
        viewerEmail,
        password,
        viewerName,
      );
      expect(viewerRegisterRes.code).toBe(201);

      const viewerLoginRes = await loginUser(viewerEmail, password);
      expect(viewerLoginRes.code).toBe(200);
      const viewerToken = viewerLoginRes.data.tokens.accessToken;

      const inviteRes = await generateInviteCode(ownerToken, groupId);
      expect(inviteRes.code).toBe(201);

      const joinRes = await request(baseUrl)
        .post('/api/group-family/join')
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ token: inviteRes.data.inviteLink.split('token=')[1] });
      expect((joinRes.body as joinUserType).code).toBe(200);

      const updateRes = await updateFamily(
        viewerToken,
        groupId,
        familyRes.data.family.id,
        updatedName,
        familyDescription,
      );
      expect(updateRes.code).toBe(403);
    });
  });

  describe('FAMILY-11: Security - IDOR Prevention', () => {
    it('should prevent user A from accessing user B family', async () => {
      const suffix = generateSuffix();
      const userAEmail = `userA11-${suffix}@example.com`;
      const userBEmail = `userB11-${suffix}@example.com`;
      const password = 'Password123!';
      const userAName = `userAName-${suffix}`;
      const userBName = `userBName-${suffix}`;
      const groupAName = `GroupA-${suffix}`;
      const groupBName = `GroupB-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const userARegisterRes = await registerUser(
        userAEmail,
        password,
        userAName,
      );
      expect(userARegisterRes.code).toBe(201);

      const userALoginRes = await loginUser(userAEmail, password);
      expect(userALoginRes.code).toBe(200);
      const userAToken = userALoginRes.data.tokens.accessToken;

      const userBRegisterRes = await registerUser(
        userBEmail,
        password,
        userBName,
      );
      expect(userBRegisterRes.code).toBe(201);

      const userBLoginRes = await loginUser(userBEmail, password);
      expect(userBLoginRes.code).toBe(200);
      const userBToken = userBLoginRes.data.tokens.accessToken;

      const groupARes = await createGroup(userAToken, groupAName);
      expect(groupARes.code).toBe(201);

      const groupBRes = await createGroup(userBToken, groupBName);
      expect(groupBRes.code).toBe(201);
      const groupBId = groupBRes.data.id;

      const familyBRes = await createFamily(
        userBToken,
        groupBId,
        familyName,
        familyDescription,
      );
      expect(familyBRes.code).toBe(201);
      const familyBId = familyBRes.data.family.id;

      const getRes = await getFamily(userAToken, familyBId);

      expect(getRes.code).toBe(403);
    });
  });

  describe('FAMILY-12: Security - Cross Group Access Prevention', () => {
    it('should prevent user from accessing family in different group', async () => {
      const suffix = generateSuffix();
      const userAEmail = `userA12-${suffix}@example.com`;
      const userBEmail = `userB12-${suffix}@example.com`;
      const password = 'Password123!';
      const userAName = `userAName-${suffix}`;
      const userBName = `userBName-${suffix}`;
      const groupAName = `GroupA-${suffix}`;
      const groupBName = `GroupB-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const userARegisterRes = await registerUser(
        userAEmail,
        password,
        userAName,
      );
      expect(userARegisterRes.code).toBe(201);

      const userALoginRes = await loginUser(userAEmail, password);
      expect(userALoginRes.code).toBe(200);
      const userAToken = userALoginRes.data.tokens.accessToken;

      const userBRegisterRes = await registerUser(
        userBEmail,
        password,
        userBName,
      );
      expect(userBRegisterRes.code).toBe(201);

      const userBLoginRes = await loginUser(userBEmail, password);
      expect(userBLoginRes.code).toBe(200);
      const userBToken = userBLoginRes.data.tokens.accessToken;

      const groupARes = await createGroup(userAToken, groupAName);
      expect(groupARes.code).toBe(201);
      const groupAId = groupARes.data.id;

      const groupBRes = await createGroup(userBToken, groupBName);
      expect(groupBRes.code).toBe(201);

      const familyARes = await createFamily(
        userAToken,
        groupAId,
        familyName,
        familyDescription,
      );
      expect(familyARes.code).toBe(201);

      const getRes = await getFamily(userBToken, familyARes.data.family.id);

      expect(getRes.code).toBe(403);
    });
  });

  describe('FAMILY-13: Security - Unauthorized Token', () => {
    it('should reject requests with invalid token', async () => {
      const suffix = generateSuffix();
      const email = `user13-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;
      const invalidToken = 'invalid.jwt.token';

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        invalidToken,
        groupId,
        familyName,
        familyDescription,
      );

      expect(familyRes.code).toBe(401);
    });
  });

  describe('FAMILY-14: Security - No Token Provided', () => {
    it('should reject requests without authorization token', async () => {
      const suffix = generateSuffix();
      const email = `user14-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await request(baseUrl)
        .post(`/api/family/${groupId}`)
        .send({
          name: familyName,
          description: familyDescription,
        });
      expect(familyRes.status).toBe(401);
    });
  });

  describe('FAMILY-15: Security - Token Expiration', () => {
    it('should handle expired token gracefully', async () => {
      const suffix = generateSuffix();
      const email = `user15-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        expiredToken,
        groupId,
        familyName,
        familyDescription,
      );
      expect(familyRes.code).toBe(401);
    });
  });

  describe('FAMILY-16: Edge Case - Invalid UUID for Group', () => {
    it('should reject invalid UUID for groupId', async () => {
      const suffix = generateSuffix();
      const email = `user16-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const invalidGroupId = 'invalid-uuid';
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const familyRes = await createFamily(
        token,
        invalidGroupId,
        familyName,
        familyDescription,
      );

      expect(familyRes.code).toBe(403);
    });
  });

  describe('FAMILY-17: Edge Case - Invalid UUID for Family', () => {
    it('should reject invalid UUID for familyId', async () => {
      const suffix = generateSuffix();
      const email = `user17-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const invalidFamilyId = 'invalid-uuid';

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const getRes = await getFamily(token, invalidFamilyId);
      expect(getRes.code).toBe(400);
    });
  });

  describe('FAMILY-18: Edge Case - Empty Family Name', () => {
    it('should reject empty family name', async () => {
      const suffix = generateSuffix();
      const email = `user18-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const groupName = `Group-${suffix}`;
      const familyName = '';
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const groupRes = await createGroup(token, groupName);
      expect(groupRes.code).toBe(201);
      const groupId = groupRes.data.id;

      const familyRes = await createFamily(
        token,
        groupId,
        familyName,
        familyDescription,
      );
      expect(familyRes.code).toBe(400);
    });
  });

  describe('FAMILY-19: Edge Case - Non-existent Group', () => {
    it('should reject operations on non-existent group', async () => {
      const suffix = generateSuffix();
      const email = `user19-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const nonExistentGroupId = '00000000-0000-0000-0000-000000000000';
      const familyName = `Family-${suffix}`;
      const familyDescription = `Description-${suffix}`;

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const familyRes = await createFamily(
        token,
        nonExistentGroupId,
        familyName,
        familyDescription,
      );

      expect(familyRes.code).toBe(403);
    });
  });

  describe('FAMILY-20: Edge Case - Non-existent Family', () => {
    it('should reject get operation on non-existent family', async () => {
      const suffix = generateSuffix();
      const email = `user20-${suffix}@example.com`;
      const password = 'Password123!';
      const fullName = `userName-${suffix}`;
      const nonExistentFamilyId = '00000000-0000-0000-0000-000000000000';

      const registerRes = await registerUser(email, password, fullName);
      expect(registerRes.code).toBe(201);

      const loginRes = await loginUser(email, password);
      expect(loginRes.code).toBe(200);
      const token = loginRes.data.tokens.accessToken;

      const getRes = await getFamily(token, nonExistentFamilyId);

      expect(getRes.code).toBe(403);
    });
  });
});
