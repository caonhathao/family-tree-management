export interface IRelationshipDto {
  localId: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: string;
}

export interface ResponseRelationshipDto {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: string;
}
