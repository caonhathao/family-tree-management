export interface CreateGroupFamilyDto {
  name: string;
  description: string;
  role: string | undefined;
}

export interface UpdateGroupFamilyDto {
  name: string;
  description: string;
}

export interface ResponseGroupFamilyDetailDto {
  id: string;
  name: string;
  description: string;
}

export interface ResponseGroupFamiliesDto extends ResponseGroupFamilyDetailDto {
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
