import { MEMBER_ROLE } from "@prisma/client";
import { z } from "zod";

export const UpdateGroupFamilyDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
export type UpdateGroupFamilyDto = z.infer<typeof UpdateGroupFamilyDtoSchema>;

export const CreateGroupFamilyDtoSchema = z.object({
  name: z.string().min(6).max(30),
  description: z.string().optional(),
  role: z.nativeEnum(MEMBER_ROLE).optional(),
});
export type CreateGroupFamilyDto = z.infer<typeof CreateGroupFamilyDtoSchema>;
