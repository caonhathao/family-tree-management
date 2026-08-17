import { z } from "zod";
import { LINEAGE_TYPE, TYPE_RELATIONSHIP } from "@/types/enums";

export const BiographyContentSchema = z.object({
  education_level: z.string(),
  occupation: z.string(),
  hometown: z.string(),
  achievements: z.string(),
});

export const FamilyMemberDtoSchema = z.object({
  localId: z.string().uuid(),
  fullName: z.string().min(1).max(100),
  gender: z.string().min(1),
  dateOfBirth: z.string().nullable().optional(),
  dateOfDeath: z.string().nullable().optional(),
  isAlive: z.boolean().optional(),
  biography: z.unknown().nullable().optional(),
  generation: z.number(),
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
});

export const RelationshipDtoSchema = z.object({
  localId: z.string(),
  fromMemberId: z.string().uuid(),
  toMemberId: z.string().uuid(),
  type: z.nativeEnum(TYPE_RELATIONSHIP),
});

export const FamilyDtoSchema = z.object({
  localId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  lineageType: z.nativeEnum(LINEAGE_TYPE),
});

export const SyncFamilyDtoSchema = z.object({
  members: z.array(FamilyMemberDtoSchema),
  relationships: z.array(RelationshipDtoSchema),
  family: FamilyDtoSchema,
});

export type IFamilyMemberDto = z.infer<typeof FamilyMemberDtoSchema>;
export type IRelationshipDto = z.infer<typeof RelationshipDtoSchema>;
export type IFamilyDto = z.infer<typeof FamilyDtoSchema>;
export type FamilyDto = z.infer<typeof SyncFamilyDtoSchema>;
export type IBiographyContent = z.infer<typeof BiographyContentSchema>;
