import { INestApplication } from '@nestjs/common';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import { register } from './helpers/auth.helpers';
import { createGroup, createInvite, joinGroup } from './helpers/group.helpers';
import {
  deleteGroupsByIds,
  deleteUsersByEmails,
} from './helpers/cleanup.helpers';
import { generateRandomSuffix } from './helpers/common.helpers';
import { AuthResponse } from 'src/modules/auth/types/auth-response.type';

describe('Invite E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: TestApi;
  const testUsers: { email: string }[] = [];
  const testGroups: { id: string }[] = [];

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      httpServer,
    } = await createTestApp({
      globalPrefix: false,
      allExceptionsFilter: true,
    });

    app = testApp;
    prisma = testPrisma;
    api = new TestApi(httpServer);
  });

  afterAll(async () => {
    if (testUsers.length > 0) {
      await deleteUsersByEmails(
        prisma,
        testUsers.map((user) => user.email),
      );
    }
    if (testGroups.length > 0) {
      await deleteGroupsByIds(
        prisma,
        testGroups.map((group) => group.id),
      );
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

      const registerOwnerResponse: AuthResponse = await register(
        api,
        ownerData,
      );

      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: ownerData.email });

      const registerMemberResponse: AuthResponse = await register(
        api,
        memberData,
      );

      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupResponse = await createGroup(api, ownerToken, {
        name: `TG${suffix}`,
        description: 'Test group description',
      });

      expect(createGroupResponse.code).toBe(201);
      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });

      const createInviteResponse = await createInvite(api, ownerToken, groupId);

      expect(createInviteResponse.code).toBe(201);
      expect(createInviteResponse.data.inviteLink).toBeDefined();
      const inviteLink = createInviteResponse.data.inviteLink;
      const inviteCode = inviteLink.split('token=')[1];

      const joinGroupResponse = await joinGroup(api, memberToken, inviteCode);

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
      const registerOwnerResponse: AuthResponse = await register(
        api,
        groupOwnerData,
      );
      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: groupOwnerData.email });
      const registerNonMemberResponse: AuthResponse = await register(
        api,
        nonMemberData,
      );
      expect(registerNonMemberResponse.code).toBe(201);

      testUsers.push({ email: nonMemberData.email });
      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const nonMemberToken = registerNonMemberResponse.data.tokens.accessToken;
      const createGroupResponse = await createGroup(api, ownerToken, {
        name: `TG${suffix}`,
        description: 'Test group description',
      });
      expect(createGroupResponse.code).toBe(201);

      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });
      const createInviteResponse = await createInvite(
        api,
        nonMemberToken,
        groupId,
      );
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

      const registerResponse: AuthResponse = await register(api, userData);
      expect(registerResponse.code).toBe(201);
      testUsers.push({ email: userData.email });

      const userToken = registerResponse.data.tokens.accessToken;

      const invalidTokens = [
        'invalid-token',
        'malformed.token',
        'nonexistent123',
      ];

      for (const token of invalidTokens) {
        const joinResponse = await joinGroup(api, userToken, token);

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

      const registerOwnerAResponse: AuthResponse = await register(
        api,
        ownerAData,
      );
      expect(registerOwnerAResponse.code).toBe(201);
      testUsers.push({ email: ownerAData.email });

      const registerOwnerBResponse: AuthResponse = await register(
        api,
        ownerBData,
      );
      expect(registerOwnerBResponse.code).toBe(201);
      testUsers.push({ email: ownerBData.email });

      const registerMemberResponse: AuthResponse = await register(
        api,
        memberData,
      );
      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerAToken = registerOwnerAResponse.data.tokens.accessToken;
      const ownerBToken = registerOwnerBResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupAResponse = await createGroup(api, ownerAToken, {
        name: `GA${suffix}`,
        description: 'Test group description',
      });
      expect(createGroupAResponse.code).toBe(201);
      const groupAId = createGroupAResponse.data.id;
      testGroups.push({ id: groupAId });

      const createGroupBResponse = await createGroup(api, ownerBToken, {
        name: `GB${suffix}`,
        description: 'Test group description',
      });
      expect(createGroupBResponse.code).toBe(201);
      const groupBId = createGroupBResponse.data.id;
      testGroups.push({ id: groupBId });

      const createInviteAResponse = await createInvite(
        api,
        ownerAToken,
        groupAId,
      );
      expect(createInviteAResponse.code).toBe(201);
      const inviteALink = createInviteAResponse.data.inviteLink;
      const inviteACode = inviteALink.split('token=')[1];

      const joinBWithInviteAResponse = await joinGroup(
        api,
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

      const registerOwnerResponse: AuthResponse = await register(
        api,
        ownerData,
      );
      expect(registerOwnerResponse.code).toBe(201);
      testUsers.push({ email: ownerData.email });

      const registerMemberResponse: AuthResponse = await register(
        api,
        memberData,
      );
      expect(registerMemberResponse.code).toBe(201);
      testUsers.push({ email: memberData.email });

      const ownerToken = registerOwnerResponse.data.tokens.accessToken;
      const memberToken = registerMemberResponse.data.tokens.accessToken;

      const createGroupResponse = await createGroup(api, ownerToken, {
        name: `TG${suffix}`,
        description: 'Test group description',
      });
      expect(createGroupResponse.code).toBe(201);
      const groupId = createGroupResponse.data.id;
      testGroups.push({ id: groupId });

      const createInviteResponse = await createInvite(api, ownerToken, groupId);
      expect(createInviteResponse.code).toBe(201);
      const inviteLink = createInviteResponse.data.inviteLink;
      const inviteCode = inviteLink.split('token=')[1];

      const firstJoinResponse = await joinGroup(api, memberToken, inviteCode);
      expect([201, 200]).toContain(firstJoinResponse.code);

      const secondJoinResponse = await joinGroup(api, memberToken, inviteCode);

      expect([400, 409]).toContain(secondJoinResponse.code);
    });
  });
});
