import { z } from "zod";

export const UpdateUserDtoSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  biography: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
