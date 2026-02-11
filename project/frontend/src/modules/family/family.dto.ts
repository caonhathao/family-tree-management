export interface IFamilyDto {
  localId: string;
  name: string;
  description?: string;
  lineageType: string;
}
export interface ResponseCreateFamilyDto {
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

export interface UpdateFamilyDto {
  id: string;
  name: string | undefined;
  description: string | undefined;
  ownerId: string | undefined;
}

export interface ResponseUpdateFamilyDto {
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

export interface ResponseFamilyDto {
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
