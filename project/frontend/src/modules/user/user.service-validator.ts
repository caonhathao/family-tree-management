import { z } from "zod";

export const UpdateUserInfoDtoSchema = z.object({
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  biography: z.string().optional(),
});
export type UpdateUserInfoDto = z.infer<typeof UpdateUserInfoDtoSchema>;

export const UpdateUserSecurityDtoSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
});
export type UpdateUserSecurityDto = z.infer<typeof UpdateUserSecurityDtoSchema>;
