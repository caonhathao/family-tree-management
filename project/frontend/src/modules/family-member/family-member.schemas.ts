import z from "zod";

export const FamilyMemberSchema = z.object({
  localId: z.string(),
  fullName: z.string().nonempty({ message: "Thiếu tên thành viên" }),
  gender: z.string().nonempty({ message: "Thiếu giới tính" }),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  isAlive: z.boolean().optional(),
  biography: z.string().optional(),
  generation: z
    .number()
    .nonnegative({ message: "Phải là số nguyên dương" })
    .nonoptional({ message: "Thiếu generation" }),
});
