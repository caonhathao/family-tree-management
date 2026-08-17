import { INestApplication } from '@nestjs/common';
import { MEMBER_ROLE } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { TestApi } from './api.client';
import { createTestApp } from './test-app';
import { PrismaService } from '../prisma/prisma.service';
import { ApiDataResponse } from 'src/common/constants/api';
import { AuthResponse } from 'src/modules/auth/types/auth-response.type';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { register } from './helpers/auth.helpers';
import { createGroup as apiCreateGroup } from './helpers/group.helpers';
import { GroupResponse } from 'src/modules/group-family/types/group-family-response.type';
import { NewFamilyResponse } from 'src/modules/family/types/family-response.type';
import {
  FamilyMemberResponse,
  FamilyMembersResponse,
} from 'src/modules/family-members/types/family-member-response.type';
import { NON_EXISTENT_UUID } from './helpers/common.helpers';
import {
  generateRandomFamily,
  generateRandomMember,
  generateRandomUser,
} from './factories';

interface FamilyDto {
  name: string;
  description?: string;
}

describe('Family Members (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: TestApi;

  // Helper function to register a user
  const registerUser = (userDto: RegisterDto): Promise<AuthResponse> =>
    register(api, userDto);

  const createGroup = (
    token: string,
    groupDto: { name: string; description: string },
  ): Promise<GroupResponse> => apiCreateGroup(api, token, groupDto);

  // Helper function to create a family
  const createFamily = (
    token: string,
    groupId: string,
    familyDto: FamilyDto,
  ): Promise<NewFamilyResponse> =>
    api.post<NewFamilyResponse>(`/family/${groupId}`, familyDto, { token });

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

    const body = await api.upload<FamilyMemberResponse>(
      'post',
      `/family-member/${groupRes.data.id}`,
      {
        familyId: memberData.familyId,
        fullName: memberData.fullName,
        gender: memberData.gender,
        dateOfBirth: memberData.dateOfBirth.toISOString(),
        generation: String(memberData.generation),
      },
      [],
      { token: newUser.data.tokens.accessToken, expect: 201 },
    );

    expect(body.data.fullName).toBe(memberData.fullName);
    expect(body.data.familyId).toBe(familyRes.data.family.id);
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

    // Create two members
    await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      generateRandomMember(familyRes.data.family.id),
      { token: newUser.data.tokens.accessToken },
    );
    await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      generateRandomMember(familyRes.data.family.id),
      { token: newUser.data.tokens.accessToken },
    );

    const body = await api.get<FamilyMembersResponse>(
      `/family-member/${familyRes.data.family.id}`,
      { token: newUser.data.tokens.accessToken, expect: 200 },
    );

    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(2);
  });

  it('1.3 should get a specific family member by ID', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);

    //create new family member
    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token },
    );
    const member = createBody.data;

    //get family member detail (get one)
    const body = await api.get<FamilyMemberResponse>(
      `/family-member/${familyRes.data.family.id}/${member.id}`,
      { token, expect: 200 },
    );

    expect(body.data.id).toBe(member.id);
    expect(body.data.fullName).toBe(memberData.fullName);
  });

  it('1.4 should update a family member successfully', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);
    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token },
    );
    const member = createBody.data;

    const updatedName = 'Jane Doe Updated';
    const body = await api.patch<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}/${familyRes.data.family.id}`,
      { memberId: member.id, fullName: updatedName },
      { token, expect: 200 },
    );

    expect(body.data.id).toBe(member.id);
    expect(body.data.fullName).toBe(updatedName);
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

    await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      { ...memberData, fullName: undefined }, // Remove required field
      { token, expect: 400 },
    );
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

    await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      { ...memberData, gender: 'INVALID_GENDER' },
      { token, expect: 400 },
    );
  });

  it('2.3 should fail to update a member with an invalid date of birth format', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    const memberData = generateRandomMember(familyRes.data.family.id);
    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token },
    );
    const member = createBody.data;

    await api.patch<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}/${member.id}`,
      { id: member.id, dateOfBirth: 'not-a-date' },
      { token, expect: 400 },
    );
  });

  it('2.4 should fail to create a member with a non-existent familyId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    await createFamily(token, groupRes.data.id, generateRandomFamily());

    const memberData = generateRandomMember(NON_EXISTENT_UUID);

    await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}/${NON_EXISTENT_UUID}`,
      memberData,
      { token, expect: 404 },
    );
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
    await api.get<FamilyMembersResponse>(`/family-member/${familyA.id}`, {
      token: tokenB,
      expect: 403,
    });
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

    await api.post<FamilyMemberResponse>(
      `/family-member/${NON_EXISTENT_UUID}`,
      memberData,
      { token, expect: 403 },
    );
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

    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token },
    );
    const member = createBody.data;

    await api.delete<ApiDataResponse<{ count: number }>>(
      `/family-member/${groupRes.data.id}/${familyRes.data.family.id}/${member.id}`,
      { token, expect: 200 },
    );

    // Verify it's gone
    await api.get<FamilyMemberResponse>(
      `/family-member/${familyRes.data.family.id}/${member.id}`,
      { token, expect: 404 },
    );
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

    const body = await api.upload<FamilyMemberResponse>(
      'post',
      `/family-member/${groupRes.data.id}`,
      {
        familyId: memberData.familyId,
        fullName: memberData.fullName,
        gender: memberData.gender,
        dateOfBirth: memberData.dateOfBirth.toISOString(),
        generation: String(memberData.generation),
      },
      [
        {
          fieldName: 'avatar',
          buffer: fs.readFileSync(imagePath),
          filename: path.basename(imagePath),
        },
      ],
      { token, expect: 201 },
    );

    expect(body.data.avatarUrl).not.toBeNull();
    expect(body.data.avatarUrl).toContain('cloudinary');
  });

  // ===========================================================================================
  // CATEGORY 4: Authentication & Authorization
  // ===========================================================================================

  it('4.1 should fail to create a member without a valid JWT token', async () => {
    await api.post<ApiDataResponse<unknown>>(
      '/family-member/some-group-id',
      {},
      {
        expect: 401,
      },
    );
  });

  it('4.2 should fail to get members without a valid JWT token', async () => {
    await api.get<ApiDataResponse<unknown>>('/family-member/some-family-id', {
      expect: 401,
    });
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
    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token: ownerToken },
    );
    const member = createBody.data;

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
        role: MEMBER_ROLE.VIEWER,
      },
    });

    // Viewer tries to update
    await api.patch<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}/${familyRes.data.family.id}`,
      { id: member.id, fullName: 'New Name From Viewer' },
      { token: viewerToken, expect: 403 },
    );
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
    const createBody = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token: ownerToken },
    );
    const member = createBody.data;

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
        role: MEMBER_ROLE.VIEWER,
      },
    });

    // Viewer tries to delete
    await api.delete<ApiDataResponse<unknown>>(
      `/family-member/${familyRes.data.family.id}/${member.id}`,
      { token: viewerToken, expect: 404 },
    );
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

    const body = await api.get<FamilyMembersResponse>(
      `/family-member/${familyRes.data.family.id}`,
      { token, expect: 200 },
    );

    expect(body.data).toEqual([]);
  });

  it('5.2 should fail to get a member with a non-UUID memberId', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    const familyData = generateRandomFamily();
    const familyRes = await createFamily(token, groupRes.data.id, familyData);

    // This will be caught by AllExceptionsFilter and returned as a generic error
    // because no specific pipe is on the param in the controller
    await api.get<FamilyMemberResponse>(
      `/family-member/${familyRes.data.family.id}/not-a-uuid`,
      { token, expect: 404 },
    );
  });

  it('5.3 should fail to update a non-existent member', async () => {
    const userData = generateRandomUser();
    const newUser = await registerUser(userData);

    const token = newUser.data.tokens.accessToken;

    const groupData = { name: 'Test Group', description: 'Test Group Desc' };
    const groupRes = await createGroup(token, groupData);

    await createFamily(token, groupRes.data.id, generateRandomFamily());

    await api.patch<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      { id: NON_EXISTENT_UUID, fullName: 'Ghost' },
      { token, expect: 404 },
    );
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
        role: MEMBER_ROLE.EDITOR,
      },
    });

    const memberData = generateRandomMember(familyRes.data.family.id);

    // Editor creates member
    const body = await api.post<FamilyMemberResponse>(
      `/family-member/${groupRes.data.id}`,
      memberData,
      { token: editorToken, expect: 201 },
    );

    expect(body.data.fullName).toBe(memberData.fullName);
  });
});
