
import { z } from 'zod';
import { USER_ROLE } from '@prisma/client';

export const UpdateGroupMemberDtoSchema = z.object({
  id: z.string().uuid(),
  role: z.nativeEnum(USER_ROLE).optional(),
});

export type UpdateGroupMemberDto = z.infer<typeof UpdateGroupMemberDtoSchema>;
