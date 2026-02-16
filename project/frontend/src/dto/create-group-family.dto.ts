
import { z } from 'zod';
import { USER_ROLE } from '@prisma/client';

export const CreateGroupFamilyDtoSchema = z.object({
  name: z.string().min(6).max(30),
  description: z.string().optional(),
  role: z.nativeEnum(USER_ROLE).optional(),
});

export type CreateGroupFamilyDto = z.infer<typeof CreateGroupFamilyDtoSchema>;
