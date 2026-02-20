import { LINEAGE_TYPE } from "@prisma/client";

export interface IFamilyDto {
  localId: string;
  name: string;
  description?: string;
  lineageType: LINEAGE_TYPE;
}
export interface IResponseCreateFamilyDto {
  family: {
    id: string;
    name: string;
    description: string;
  };
  owner: {
    id: string;
    name: string;
    avatar: string | undefined;
  };
}

export interface IUpdateFamilyDto {
  id: string;
  name: string | undefined;
  description: string | undefined;
  ownerId: string | undefined;
}

export interface IResponseUpdateFamilyDto {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    userProfile: {
      fullName: string;
      avatar: string | undefined;
    };
  };
}

export interface IResponseFamilyDto {
  id: true;
  name: true;
  description: true;
  owner: {
    id: true;
    userProfile: {
      fullName: true;
    };
  };
  _count: {
    familyMembers: true;
    albums: true;
    events: true;
  };
}
