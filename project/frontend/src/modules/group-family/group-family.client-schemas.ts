import { MEMBER_ROLE } from "@prisma/client";
import z from "zod";

export const CreateGroupFamilySchema = z.object({
  name: z
    .string()
    .min(6, "Tên nhóm tối thiểu 6 ký tự.")
    .max(30, "Tên nhóm tối đa 30 ký tự."),
  description: z.string().optional(),
  role: z.enum(MEMBER_ROLE, {
    message: "Vui lòng nhập vai trò của bạn.",
  }),
});

export const UpdateGroupFamilySchema = z.object({
  name: z.string().nonempty("Vui lòng nhập tên nhóm."),
  description: z.string().optional(),
});
