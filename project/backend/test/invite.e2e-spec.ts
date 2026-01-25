import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { response } from 'express';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
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
describe('Invite E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUsers: any[] = [];
  const testGroups: any[] = [];

  const generateRandomSuffix = () =>
    `${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const registerUser = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, fullName });

    if (response.status !== 201) {
      console.log(
        `[${expect.getState().currentTestName}] Register member failed:`,
        response.body,
      );
    }
    return response.body as userType;
  };

  const loginUser = async (email: string, password: string) => {
    return await request(app.getHttpServer())
      .post('/auth/login-base')
      .send({ email, password });
  };

  const createGroup = async (token: string, groupName: string) => {
    const response = await request(app.getHttpServer())
      .post('/group-family')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: groupName, description: 'Test group description' });
    if (response.status !== 201) {
      console.log(
        `[${expect.getState().currentTestName}] Create group failed:`,
        response.body,
      );
    }
    return response.body as newGroup;
  };

  const createInvite = async (token: string, groupId: string) => {
    const response = await request(app.getHttpServer())
      .post('/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId });
    if (response.status !== 201) {
      console.log(
        `[${expect.getState().currentTestName}] Create invite failed:`,
        response.body,
      );
    }
    return response.body as inviteType;
  };

  const joinGroup = async (token: string, inviteToken: string) => {
    const response = await request(app.getHttpServer())
      .post('/group-family/join')
      .set('Authorization', `Bearer ${token}`)
      .query({ token: inviteToken });

    if (response.status !== 201 && response.status !== 200) {
      console.log(
        `[${expect.getState().currentTestName}] Join group failed:`,
        response.body,
      );
    }
    return response.body as joinUserType;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    if (testUsers.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: testUsers.map((user) => user.email),
          },
        },
      });
    }
    if (testGroups.length > 0) {
      await prisma.groupFamily.deleteMany({
        where: {
          id: {
            in: testGroups.map((group) => group.id),
          },
        },
      });
    }
    await app.close();
  });

  describe('1. Happy Path: Generate invite link and join successfully', () => {
    it('should create invite and allow user to join group successfully', async () => {
      const suffix = generateRandomSuffix();

      const ownerData = {
        email: `owner_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Owner User',
      };

      const memberData = {
        email: `member_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Member User',
      };

      const registerOwnerResponse = await registerUser(
        ownerData.email,
        ownerData.password,
        ownerData.fullName,
      );

      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: ownerData.email });

      const registerMemberResponse = await registerUser(
        memberData.email,
        memberData.password,
        memberData.fullName,
      );

      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupResponse = await createGroup(ownerToken, `TG${suffix}`);

      expect(createGroupResponse.code).toBe(201);
      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });

      const createInviteResponse = await createInvite(ownerToken, groupId);

      expect(createInviteResponse.code).toBe(201);
      expect(createInviteResponse.data.inviteLink).toBeDefined();
      const inviteLink = createInviteResponse.data.inviteLink;
      const inviteCode = inviteLink.split('token=')[1];

      const joinGroupResponse = await joinGroup(memberToken, inviteCode);

      expect([201, 200]).toContain(joinGroupResponse.code);
    });
  });

  describe('2. Permission: Non-member fails to generate invite (403)', () => {
    it('should reject invite creation from user not in group', async () => {
      const suffix = generateRandomSuffix();
      const groupOwnerData = {
        email: `owner_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Group Owner',
      };
      const nonMemberData = {
        email: `nonmember_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Non Member',
      };
      const registerOwnerResponse = await registerUser(
        groupOwnerData.email,
        groupOwnerData.password,
        groupOwnerData.fullName,
      );
      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: groupOwnerData.email });
      const registerNonMemberResponse = await registerUser(
        nonMemberData.email,
        nonMemberData.password,
        nonMemberData.fullName,
      );
      expect(registerNonMemberResponse.code).toBe(201);

      testUsers.push({ email: nonMemberData.email });
      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const nonMemberToken = registerNonMemberResponse.data.tokens.accessToken;
      const createGroupResponse = await createGroup(ownerToken, `TG${suffix}`);
      expect(createGroupResponse.code).toBe(201);

      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });
      const createInviteResponse = await createInvite(nonMemberToken, groupId);
      expect(createInviteResponse.code).toBe(403);
    });
  });

  describe('3. Invalid Token: Join with malformed or non-existent invite token (400/404)', () => {
    it('should reject join attempt with invalid invite token', async () => {
      const suffix = generateRandomSuffix();

      const userData = {
        email: `user_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Test User',
      };

      const registerResponse = await registerUser(
        userData.email,
        userData.password,
        userData.fullName,
      );
      expect(registerResponse.code).toBe(201);
      testUsers.push({ email: userData.email });

      const userToken = registerResponse.data.tokens.accessToken;

      const invalidTokens = [
        'invalid-token',
        'malformed.token',
        'nonexistent123',
      ];

      for (const token of invalidTokens) {
        const joinResponse = await joinGroup(userToken, token);

        expect([400, 404]).toContain(joinResponse.code);
      }
    });
  });

  describe('4. Security IDOR: User tries to join Group B using invite link from Group C', () => {
    it('should prevent joining wrong group via manipulated invite token', async () => {
      const suffix = generateRandomSuffix();

      const ownerAData = {
        email: `ownerA_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Owner A User',
      };

      const ownerBData = {
        email: `ownerB_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Owner B User',
      };

      const memberData = {
        email: `member_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Member User',
      };

      const registerOwnerAResponse = await registerUser(
        ownerAData.email,
        ownerAData.password,
        ownerAData.fullName,
      );
      expect(registerOwnerAResponse.code).toBe(201);
      testUsers.push({ email: ownerAData.email });

      const registerOwnerBResponse = await registerUser(
        ownerBData.email,
        ownerBData.password,
        ownerBData.fullName,
      );
      expect(registerOwnerBResponse.code).toBe(201);
      testUsers.push({ email: ownerBData.email });

      const registerMemberResponse = await registerUser(
        memberData.email,
        memberData.password,
        memberData.fullName,
      );
      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerAToken = registerOwnerAResponse.data.tokens.accessToken;
      const ownerBToken = registerOwnerBResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupAResponse = await createGroup(
        ownerAToken,
        `GA${suffix}`,
      );
      expect(createGroupAResponse.code).toBe(201);
      const groupAId = createGroupAResponse.data.id;
      testGroups.push({ id: groupAId });

      const createGroupBResponse = await createGroup(
        ownerBToken,
        `GB${suffix}`,
      );
      expect(createGroupBResponse.code).toBe(201);
      const groupBId = createGroupBResponse.data.id;
      testGroups.push({ id: groupBId });

      const createInviteAResponse = await createInvite(ownerAToken, groupAId);
      expect(createInviteAResponse.code).toBe(201);
      const inviteALink = createInviteAResponse.data.inviteLink;
      const inviteACode = inviteALink.split('token=')[1];

      const joinBWithInviteAResponse = await joinGroup(
        memberToken,
        inviteACode,
      );
      expect([201, 200]).toContain(joinBWithInviteAResponse.code);

      expect(joinBWithInviteAResponse.data.groupId).toBe(groupAId);
      expect(joinBWithInviteAResponse.data.groupId).not.toBe(groupBId);
    });
  });

  describe('5. Conflict: User who is already a member fails to join again (400/409)', () => {
    it('should prevent existing member from joining the same group again', async () => {
      const suffix = generateRandomSuffix();

      const ownerData = {
        email: `owner_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Owner User',
      };

      const memberData = {
        email: `member_${suffix}@example.com`,
        password: 'password123',
        fullName: 'Member User',
      };

      const registerOwnerResponse = await registerUser(
        ownerData.email,
        ownerData.password,
        ownerData.fullName,
      );
      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: ownerData.email });

      const registerMemberResponse = await registerUser(
        memberData.email,
        memberData.password,
        memberData.fullName,
      );
      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupResponse = await createGroup(ownerToken, `TG${suffix}`);
      expect(createGroupResponse.code).toBe(201);
      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });

      const createInviteResponse = await createInvite(ownerToken, groupId);
      expect(createInviteResponse.code).toBe(201);
      const inviteLink = createInviteResponse.data.inviteLink;
      const inviteCode = inviteLink.split('token=')[1];

      const firstJoinResponse = await joinGroup(memberToken, inviteCode);
      expect([201, 200]).toContain(firstJoinResponse.code);

      const secondJoinResponse = await joinGroup(memberToken, inviteCode);

      expect([400, 409]).toContain(secondJoinResponse.code);
    });
  });
});
