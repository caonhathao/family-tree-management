import { MEMBER_ROLE } from "@prisma/client";

export interface CreateGroupFamilyDto {
  name: string;
  description: string;
  role: MEMBER_ROLE;
}

export interface IUpdateGroupFamilyDto {
  name: string;
  description: string;
}

export interface ResponseGroupFamilyDetailDto {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  groupMembers: {
    member: {
      userProfile: {
        avatar: string;
        fullName: string;
        id: string;
        userId: string;
      };
    };
    role: MEMBER_ROLE;
    isLeader: boolean;
  }[];
}

export interface IResponseGroupFamiliesDto {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResponseJoinGroupDto {
  id: string;
  groupId: string;
  memberId: string;
  role: string;
  isLeader: boolean;
}
