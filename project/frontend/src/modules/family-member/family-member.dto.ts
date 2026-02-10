export interface IFamilyMemberDto {
  localId: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  isAlive?: boolean;
  biography?: string;
  generation: number;
  positionX?: number;
  positionY?: number;
}

export interface IUpdateFamilyMemberDto {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  dateOfDeath: Date;
  isAlive: boolean;
  biography?: string;
  generation: number;
}

export interface ResponseCreateFamilyMemberDto {
  id: string;
  fullName: string;
  generation: string;
  isAlive: string;
  avatarUrl: string;
}

export interface ResponseUpdateFamilyMemberDto {
  id: string;
  fullName: string;
  generation: string;
  isAlive: string;
  avatarUrl: string;
}
