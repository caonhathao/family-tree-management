import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { IFamilyDto } from "@/modules/family/family.dto";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";

export interface IDraftFamilyData {
  member: IFamilyMemberDto[];
  relationships: IRelationshipDto[];
  family: IFamilyDto;
}
