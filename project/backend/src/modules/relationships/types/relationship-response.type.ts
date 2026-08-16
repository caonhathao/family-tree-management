import { TYPE_RELATIONSHIP } from '@prisma/client';
import { ApiDataResponse } from 'src/common/constants/api';

export interface RelationshipData {
  id: string;
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: TYPE_RELATIONSHIP;
}

export type RelationshipResponse = ApiDataResponse<RelationshipData>;

export interface RelationshipCreationData {
  count: number;
}

export type RelationshipCreationResponse =
  ApiDataResponse<RelationshipCreationData>;

export interface RelationshipMapMember {
  id: string;
  parents: Array<{ id: string }>;
  spouse: { id: string } | null;
  children: Array<{ id: string }>;
}

export interface RelationshipGeneration {
  level: number;
  members: RelationshipMapMember[];
}

export interface RelationshipMapData {
  generations: RelationshipGeneration[];
}

export type RelationshipMapResponse = ApiDataResponse<RelationshipMapData>;
