export interface CreateGroupFamilyDto {
  name: string;
  description: string;
  role: string;
}

export interface IUpdateGroupFamilyDto {
  name: string;
  description: string;
}

export interface ResponseGroupFamilyDetailDto {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  groupMembers: {
    member: {
      userProfile: {
        avatar: string;
        fullName: string;
        id: string;
        userId: string;
      };
    };
  }[];
}

export interface ResponseGroupFamiliesDto {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseJoinGroupDto {
  id: string;
  groupId: string;
  memberId: string;
  role: string;
  inLeader: string;
}
