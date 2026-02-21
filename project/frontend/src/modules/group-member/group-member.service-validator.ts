import { z } from "zod";
import { MEMBER_ROLE } from "@prisma/client";

export const UpdateGroupMemberDtoSchema = z.object({
  id: z.string().uuid(),
  role: z.nativeEnum(MEMBER_ROLE).optional(),
});

export type UpdateGroupMemberDto = z.infer<typeof UpdateGroupMemberDtoSchema>;
