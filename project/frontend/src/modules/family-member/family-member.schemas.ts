import z from "zod";

export const FamilyMemberSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.isAlive === false) {
        return !!data.dateOfDeath && data.dateOfDeath.length > 0;
      }
      return true;
    },
    {
      message: "Thành viên đã mất phải có ngày mất",
      path: ["dateOfDeath"],
    },
  )
  .refine(
    (data) => {
      if (data.isAlive === true) {
        return !data.dateOfDeath || data.dateOfDeath.length === 0;
      }
      return true;
    },
    {
      message: "Thành viên còn sống không được có ngày mất",
      path: ["dateOfDeath"],
    },
  );
