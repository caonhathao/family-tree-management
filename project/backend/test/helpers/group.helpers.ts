import { MEMBER_ROLE } from '@prisma/client';
import { TestApi } from '../api.client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupFamilyDto } from 'src/modules/group-family/dto/create-group-family.dto';
import { CreateInviteDto } from 'src/modules/invite/dto/create-invite.dto';
import {
  GroupResponse,
  JoinGroupResponse,
} from 'src/modules/group-family/types/group-family-response.type';
import { InviteResponse } from 'src/modules/invite/types/invite-response.type';

export interface TestGroupMember {
  id: string;
  groupId: string;
  memberId: string;
  role: MEMBER_ROLE;
  isLeader: boolean;
}

export const createGroup = (
  api: TestApi,
  token: string,
  data: CreateGroupFamilyDto,
  expectStatus?: number,
): Promise<GroupResponse> =>
  api.post<GroupResponse>('/group-family', data, {
    token,
    ...(expectStatus !== undefined ? { expect: expectStatus } : {}),
  });

export const createInvite = (
  api: TestApi,
  token: string,
  groupId: string,
  expectStatus?: number,
): Promise<InviteResponse> => {
  const data: CreateInviteDto = { groupId };
  return api.post<InviteResponse>('/invite', data, {
    token,
    ...(expectStatus !== undefined ? { expect: expectStatus } : {}),
  });
};

export const joinGroup = (
  api: TestApi,
  token: string,
  inviteToken: string,
  expectStatus?: number,
): Promise<JoinGroupResponse> =>
  api.post<JoinGroupResponse>('/group-family/join', undefined, {
    token,
    query: { token: inviteToken },
    ...(expectStatus !== undefined ? { expect: expectStatus } : {}),
  });

export const addMemberToGroup = async (
  prisma: PrismaService,
  groupId: string,
  memberId: string,
  role: MEMBER_ROLE = MEMBER_ROLE.VIEWER,
): Promise<TestGroupMember> => {
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      memberId_groupId: {
        groupId,
        memberId,
      },
    },
  });

  const member =
    existingMember === null
      ? await prisma.groupMember.create({
          data: { groupId, memberId, role, isLeader: false },
        })
      : await prisma.groupMember.update({
          where: {
            memberId_groupId: {
              groupId,
              memberId,
            },
          },
          data: { role, isLeader: false },
        });

  return {
    id: member.id,
    groupId: member.groupId,
    memberId: member.memberId,
    role: member.role,
    isLeader: member.isLeader,
  };
};

export const setGroupLeader = async (
  prisma: PrismaService,
  groupId: string,
  memberId: string,
): Promise<void> => {
  await prisma.groupMember.updateMany({
    where: {
      groupId,
      memberId,
    },
    data: {
      isLeader: true,
      role: MEMBER_ROLE.OWNER,
    },
  });
};
