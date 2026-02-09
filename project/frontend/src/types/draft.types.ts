import { ICreateFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { ICreateFamilyDto } from "@/modules/family/family.dto";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";

export interface IDraftFamilyData {
  member: ICreateFamilyMemberDto[];
  relationships: IRelationshipDto[];
  family: ICreateFamilyDto;
}
