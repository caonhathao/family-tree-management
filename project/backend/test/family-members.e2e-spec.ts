import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { USER_ROLE, GENDER } from '@prisma/client';

describe('Family Members E2E Tests', () => {
  let app: INestApplication;
  let baseUrl: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    baseUrl = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateSuffix = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const registerUser = async (email, password, fullName) => {
    const response = await request(baseUrl)
      .post('/api/auth/register')
      .send({ email, password, fullName });
    if (response.status !== 201) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const loginUser = async (email, password) => {
    const response = await request(baseUrl)
      .post('/api/auth/login-base')
      .send({ email, password });
    if (response.status !== 200) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const createGroup = async (token, groupName) => {
    const response = await request(baseUrl)
      .post('/api/group-family')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: groupName, description: 'Test Group' });
    if (response.status !== 201) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const createFamily = async (token, groupId, data) => {
    const response = await request(baseUrl)
      .post(`/api/family/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(data);
    if (response.status !== 201) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const getFamilyMembers = async (token, familyId) => {
    const response = await request(baseUrl)
      .get(`/api/member/${familyId}`)
      .set('Authorization', `Bearer ${token}`);
    if (
      response.status !== 200 &&
      response.status !== 403 &&
      response.status !== 404 &&
      response.status !== 400
    ) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const updateMemberRole = async (token, groupId, memberId, newRole) => {
    const response = await request(baseUrl)
      .patch(`/api/group-member/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ memberId, role: newRole });
    if (
      response.status !== 200 &&
      response.status !== 403 &&
      response.status !== 400
    ) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const removeMember = async (token, familyId, memberId) => {
    const response = await request(baseUrl)
      .delete(`/api/member/${familyId}/${memberId}`)
      .set('Authorization', `Bearer ${token}`);
    if (
      response.status !== 200 &&
      response.status !== 403 &&
      response.status !== 404
    ) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const createMemberRecord = async (token, groupId, data) => {
    const req = request(baseUrl)
      .post(`/api/member/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('familyId', data.familyId)
      .field('fullName', data.fullName)
      .field('gender', data.gender)
      .field('dateOfBirth', data.dateOfBirth)
      .field('generation', data.generation)
      .field('isAlive', data.isAlive ?? true);

    const response = await req;
    if (
      response.status !== 201 &&
      response.status !== 403 &&
      response.status !== 400
    ) {
      console.error(`FAILED AT: ${expect.getState().currentTestName}`);
      console.dir(response.body, { depth: null });
    }
    return response;
  };

  const joinGroup = async (token, inviteToken) => {
    return await request(baseUrl)
      .post('/api/group-family/join')
      .set('Authorization', `Bearer ${token}`)
      .query({ token: inviteToken });
  };

  const getInviteLink = async (token, groupId) => {
    const res = await request(baseUrl)
      .post('/api/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId });
    return res.body.data.inviteLink.split('token=')[1];
  };

  describe('Happy Paths (5)', () => {
    it('MEM-01: Should create a family member successfully', async () => {
      const suffix = generateSuffix();
      const email = `user${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Full Name');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;

      const group = await createGroup(token, 'Group ' + suffix);
      const groupId = group.body.data.id;

      const family = await createFamily(token, groupId, {
        name: 'Family ' + suffix,
        description: 'Desc',
      });
      const familyId = family.body.data.family.id;

      const res = await createMemberRecord(token, groupId, {
        familyId,
        fullName: 'Member ' + suffix,
        gender: GENDER.MALE,
        dateOfBirth: '1990-01-01',
        generation: 1,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.fullName).toBe('Member ' + suffix);
    });

    it('MEM-02: Should list all family members', async () => {
      const suffix = generateSuffix();
      const email = `user${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Full Name');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;
      const group = await createGroup(token, 'Group ' + suffix);
      const groupId = group.body.data.id;
      const family = await createFamily(token, groupId, {
        name: 'Family ' + suffix,
        description: 'Desc',
      });
      const familyId = family.body.data.family.id;

      await createMemberRecord(token, groupId, {
        familyId,
        fullName: 'M1',
        gender: GENDER.MALE,
        dateOfBirth: '1990-01-01',
        generation: 1,
      });

      const res = await getFamilyMembers(token, familyId);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('MEM-03: Should update a family member', async () => {
      const suffix = generateSuffix();
      const email = `user${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Full Name');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;
      const group = await createGroup(token, 'Group ' + suffix);
      const groupId = group.body.data.id;
      const family = await createFamily(token, groupId, {
        name: 'Family ' + suffix,
        description: 'Desc',
      });
      const familyId = family.body.data.family.id;

      const member = await createMemberRecord(token, groupId, {
        familyId,
        fullName: 'Old Name',
        gender: GENDER.MALE,
        dateOfBirth: '1990-01-01',
        generation: 1,
      });
      const memberId = member.body.data.id;

      const res = await request(baseUrl)
        .patch(`/api/member/${groupId}`)
        .set('Authorization', `Bearer ${token}`)
        .field('id', memberId)
        .field('fullName', 'New Name');

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('New Name');
    });

    it('MEM-04: Should get a single family member', async () => {
      const suffix = generateSuffix();
      const email = `user${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Full Name');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;
      const group = await createGroup(token, 'Group ' + suffix);
      const groupId = group.body.data.id;
      const family = await createFamily(token, groupId, {
        name: 'Family ' + suffix,
        description: 'Desc',
      });
      const familyId = family.body.data.family.id;
      const member = await createMemberRecord(token, groupId, {
        familyId,
        fullName: 'Target',
        gender: GENDER.FEMALE,
        dateOfBirth: '1995-05-05',
        generation: 2,
      });
      const memberId = member.body.data.id;

      const res = await request(baseUrl)
        .get(`/api/member/${familyId}/${memberId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Target');
    });

    it('MEM-05: Should remove a family member', async () => {
      const suffix = generateSuffix();
      const email = `user${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Full Name');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;
      const group = await createGroup(token, 'Group ' + suffix);
      const groupId = group.body.data.id;
      const family = await createFamily(token, groupId, {
        name: 'Family ' + suffix,
        description: 'Desc',
      });
      const familyId = family.body.data.family.id;
      const member = await createMemberRecord(token, groupId, {
        familyId,
        fullName: 'To Be Deleted',
        gender: GENDER.OTHER,
        dateOfBirth: '2000-01-01',
        generation: 3,
      });
      const memberId = member.body.data.id;

      const res = await removeMember(token, familyId, memberId);
      expect(res.status).toBe(200);

      const check = await request(baseUrl)
        .get(`/api/member/${familyId}/${memberId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(check.status).toBe(404);
    });
  });

  describe('Role Enforcement (5)', () => {
    it('MEM-06: OWNER can do everything (Create)', async () => {
      const suffix = generateSuffix();
      const email = `owner${suffix}@test.com`;
      await registerUser(email, 'Pass123!', 'Owner');
      const login = await loginUser(email, 'Pass123!');
      const token = login.body.data.tokens.accessToken;
      const group = await createGroup(token, 'G');
      const family = await createFamily(token, group.body.data.id, {
        name: 'F',
        description: 'D',
      });

      const res = await createMemberRecord(token, group.body.data.id, {
        familyId: family.body.data.family.id,
        fullName: 'P',
        gender: GENDER.MALE,
        dateOfBirth: '1990-01-01',
        generation: 1,
      });
      expect(res.status).toBe(201);
    });

    it('MEM-07: EDITOR can update member', async () => {
      const suffix = generateSuffix();
      const ownerLogin = await registerUser(
        `o${suffix}@t.com`,
        'Pass123!',
        'O',
      ).then(() => loginUser(`o${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(
        ownerLogin.body.data.tokens.accessToken,
        'G',
      );
      const family = await createFamily(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );
      const member = await createMemberRecord(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        {
          familyId: family.body.data.family.id,
          fullName: 'P',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const editorEmail = `e${suffix}@t.com`;
      await registerUser(editorEmail, 'Pass123!', 'E');
      const editorLogin = await loginUser(editorEmail, 'Pass123!');
      const inviteToken = await getInviteLink(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
      );
      await joinGroup(editorLogin.body.data.tokens.accessToken, inviteToken);

      const joinerId = editorLogin.body.data.user.id;
      await updateMemberRole(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        joinerId,
        USER_ROLE.EDITOR,
      );

      const res = await request(baseUrl)
        .patch(`/api/member/${group.body.data.id}`)
        .set(
          'Authorization',
          `Bearer ${editorLogin.body.data.tokens.accessToken}`,
        )
        .field('id', member.body.data.id)
        .field('fullName', 'Updated By Editor');

      expect(res.status).toBe(200);
    });

    it('MEM-08: VIEWER can list members but not delete', async () => {
      const suffix = generateSuffix();
      const ownerLogin = await registerUser(
        `o${suffix}@t.com`,
        'Pass123!',
        'O',
      ).then(() => loginUser(`o${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(
        ownerLogin.body.data.tokens.accessToken,
        'G',
      );
      const family = await createFamily(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );
      const member = await createMemberRecord(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        {
          familyId: family.body.data.family.id,
          fullName: 'P',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const viewerLogin = await registerUser(
        `v${suffix}@t.com`,
        'Pass123!',
        'V',
      ).then(() => loginUser(`v${suffix}@t.com`, 'Pass123!'));
      const inviteToken = await getInviteLink(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
      );
      await joinGroup(viewerLogin.body.data.tokens.accessToken, inviteToken);
      await updateMemberRole(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        viewerLogin.body.data.user.id,
        USER_ROLE.VIEWER,
      );

      const list = await getFamilyMembers(
        viewerLogin.body.data.tokens.accessToken,
        family.body.data.family.id,
      );
      expect(list.status).toBe(200);

      const del = await removeMember(
        viewerLogin.body.data.tokens.accessToken,
        family.body.data.family.id,
        member.body.data.id,
      );
      expect(del.status).toBe(403);
    });

    it('MEM-09: EDITOR can delete member', async () => {
      const suffix = generateSuffix();
      const ownerLogin = await registerUser(
        `o${suffix}@t.com`,
        'Pass123!',
        'O',
      ).then(() => loginUser(`o${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(
        ownerLogin.body.data.tokens.accessToken,
        'G',
      );
      const family = await createFamily(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );
      const member = await createMemberRecord(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        {
          familyId: family.body.data.family.id,
          fullName: 'P',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const editorLogin = await registerUser(
        `e${suffix}@t.com`,
        'Pass123!',
        'E',
      ).then(() => loginUser(`e${suffix}@t.com`, 'Pass123!'));
      const inviteToken = await getInviteLink(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
      );
      await joinGroup(editorLogin.body.data.tokens.accessToken, inviteToken);
      await updateMemberRole(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        editorLogin.body.data.user.id,
        USER_ROLE.EDITOR,
      );

      const res = await removeMember(
        editorLogin.body.data.tokens.accessToken,
        family.body.data.family.id,
        member.body.data.id,
      );
      expect(res.status).toBe(200);
    });

    it('MEM-10: VIEWER can create member', async () => {
      const suffix = generateSuffix();
      const ownerLogin = await registerUser(
        `o${suffix}@t.com`,
        'Pass123!',
        'O',
      ).then(() => loginUser(`o${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(
        ownerLogin.body.data.tokens.accessToken,
        'G',
      );
      const family = await createFamily(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );

      const viewerLogin = await registerUser(
        `v${suffix}@t.com`,
        'Pass123!',
        'V',
      ).then(() => loginUser(`v${suffix}@t.com`, 'Pass123!'));
      const inviteToken = await getInviteLink(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
      );
      await joinGroup(viewerLogin.body.data.tokens.accessToken, inviteToken);
      await updateMemberRole(
        ownerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        viewerLogin.body.data.user.id,
        USER_ROLE.VIEWER,
      );

      const res = await createMemberRecord(
        viewerLogin.body.data.tokens.accessToken,
        group.body.data.id,
        {
          familyId: family.body.data.family.id,
          fullName: 'V-Created',
          gender: GENDER.FEMALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );
      expect(res.status).toBe(201);
    });
  });

  describe('Security & IDOR (5)', () => {
    it('MEM-11: User A trying to view members of Family B (Not in Group)', async () => {
      const suffix = generateSuffix();
      const userALogin = await registerUser(
        `a${suffix}@t.com`,
        'Pass123!',
        'A',
      ).then(() => loginUser(`a${suffix}@t.com`, 'Pass123!'));
      const userBLogin = await registerUser(
        `b${suffix}@t.com`,
        'Pass123!',
        'B',
      ).then(() => loginUser(`b${suffix}@t.com`, 'Pass123!'));

      const groupB = await createGroup(
        userBLogin.body.data.tokens.accessToken,
        'GB',
      );
      const familyB = await createFamily(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        { name: 'FB', description: 'D' },
      );

      const res = await getFamilyMembers(
        userALogin.body.data.tokens.accessToken,
        familyB.body.data.family.id,
      );
      expect(res.status).toBe(403);
    });

    it('MEM-12: User A trying to create member in Family B', async () => {
      const suffix = generateSuffix();
      const userALogin = await registerUser(
        `a${suffix}@t.com`,
        'Pass123!',
        'A',
      ).then(() => loginUser(`a${suffix}@t.com`, 'Pass123!'));
      const userBLogin = await registerUser(
        `b${suffix}@t.com`,
        'Pass123!',
        'B',
      ).then(() => loginUser(`b${suffix}@t.com`, 'Pass123!'));

      const groupB = await createGroup(
        userBLogin.body.data.tokens.accessToken,
        'GB',
      );
      const familyB = await createFamily(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        { name: 'FB', description: 'D' },
      );

      const res = await createMemberRecord(
        userALogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        {
          familyId: familyB.body.data.family.id,
          fullName: 'Hacker',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );
      expect(res.status).toBe(403);
    });

    it('MEM-13: User A trying to update member of Family B', async () => {
      const suffix = generateSuffix();
      const userALogin = await registerUser(
        `a${suffix}@t.com`,
        'Pass123!',
        'A',
      ).then(() => loginUser(`a${suffix}@t.com`, 'Pass123!'));
      const userBLogin = await registerUser(
        `b${suffix}@t.com`,
        'Pass123!',
        'B',
      ).then(() => loginUser(`b${suffix}@t.com`, 'Pass123!'));
      const groupB = await createGroup(
        userBLogin.body.data.tokens.accessToken,
        'GB',
      );
      const familyB = await createFamily(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        { name: 'FB', description: 'D' },
      );
      const memberB = await createMemberRecord(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        {
          familyId: familyB.body.data.family.id,
          fullName: 'B',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const res = await request(baseUrl)
        .patch(`/api/member/${groupB.body.data.id}`)
        .set(
          'Authorization',
          `Bearer ${userALogin.body.data.tokens.accessToken}`,
        )
        .field('id', memberB.body.data.id)
        .field('fullName', 'Hacked');
      expect(res.status).toBe(403);
    });

    it('MEM-14: User A trying to delete member of Family B', async () => {
      const suffix = generateSuffix();
      const userALogin = await registerUser(
        `a${suffix}@t.com`,
        'Pass123!',
        'A',
      ).then(() => loginUser(`a${suffix}@t.com`, 'Pass123!'));
      const userBLogin = await registerUser(
        `b${suffix}@t.com`,
        'Pass123!',
        'B',
      ).then(() => loginUser(`b${suffix}@t.com`, 'Pass123!'));
      const groupB = await createGroup(
        userBLogin.body.data.tokens.accessToken,
        'GB',
      );
      const familyB = await createFamily(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        { name: 'FB', description: 'D' },
      );
      const memberB = await createMemberRecord(
        userBLogin.body.data.tokens.accessToken,
        groupB.body.data.id,
        {
          familyId: familyB.body.data.family.id,
          fullName: 'B',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const res = await removeMember(
        userALogin.body.data.tokens.accessToken,
        familyB.body.data.family.id,
        memberB.body.data.id,
      );
      expect(res.status).toBe(403);
    });

    it('MEM-15: IDOR - View member with mismatched familyId', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const group1 = await createGroup(
        login.body.data.tokens.accessToken,
        'G1',
      );
      const group2 = await createGroup(
        login.body.data.tokens.accessToken,
        'G2',
      );
      const family1 = await createFamily(
        login.body.data.tokens.accessToken,
        group1.body.data.id,
        { name: 'F1', description: 'D' },
      );
      const family2 = await createFamily(
        login.body.data.tokens.accessToken,
        group2.body.data.id,
        { name: 'F2', description: 'D' },
      );
      const member1 = await createMemberRecord(
        login.body.data.tokens.accessToken,
        group1.body.data.id,
        {
          familyId: family1.body.data.family.id,
          fullName: 'M1',
          gender: GENDER.MALE,
          dateOfBirth: '1990-01-01',
          generation: 1,
        },
      );

      const res = await request(baseUrl)
        .get(
          `/api/member/${family2.body.data.family.id}/${member1.body.data.id}`,
        )
        .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Validation & Conflicts (5)', () => {
    it('MEM-16: Invalid UUIDs for familyId', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const res = await getFamilyMembers(
        login.body.data.tokens.accessToken,
        'not-a-uuid',
      );
      expect(res.status).toBe(400);
    });

    it('MEM-17: Promoting to non-existent roles', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(login.body.data.tokens.accessToken, 'G');
      const res = await updateMemberRole(
        login.body.data.tokens.accessToken,
        group.body.data.id,
        login.body.data.user.id,
        'SUPER_ADMIN',
      );
      expect(res.status).toBe(400);
    });

    it('MEM-18: Removing non-existent member', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(login.body.data.tokens.accessToken, 'G');
      const family = await createFamily(
        login.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await removeMember(
        login.body.data.tokens.accessToken,
        family.body.data.family.id,
        fakeId,
      );
      expect(res.status).toBe(404);
    });

    it('MEM-19: Create member with missing required fields (fullName)', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(login.body.data.tokens.accessToken, 'G');
      const family = await createFamily(
        login.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );

      const res = await request(baseUrl)
        .post(`/api/member/${group.body.data.id}`)
        .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
        .field('familyId', family.body.data.family.id)
        .field('gender', GENDER.MALE)
        .field('dateOfBirth', '1990-01-01')
        .field('generation', 1);

      expect(res.status).toBe(400);
    });

    it('MEM-20: Create member with invalid generation type (string)', async () => {
      const suffix = generateSuffix();
      const login = await registerUser(
        `u${suffix}@t.com`,
        'Pass123!',
        'U',
      ).then(() => loginUser(`u${suffix}@t.com`, 'Pass123!'));
      const group = await createGroup(login.body.data.tokens.accessToken, 'G');
      const family = await createFamily(
        login.body.data.tokens.accessToken,
        group.body.data.id,
        { name: 'F', description: 'D' },
      );

      const res = await request(baseUrl)
        .post(`/api/member/${group.body.data.id}`)
        .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
        .field('familyId', family.body.data.family.id)
        .field('fullName', 'Test')
        .field('gender', GENDER.MALE)
        .field('dateOfBirth', '1990-01-01')
        .field('generation', 'first');

      expect(res.status).toBe(400);
    });
  });
});
