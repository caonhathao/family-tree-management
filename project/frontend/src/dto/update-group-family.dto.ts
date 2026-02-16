
import { z } from 'zod';

export const UpdateGroupFamilyDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateGroupFamilyDto = z.infer<typeof UpdateGroupFamilyDtoSchema>;
