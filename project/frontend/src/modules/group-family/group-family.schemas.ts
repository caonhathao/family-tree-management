import z from "zod";

export const CreateGroupFamilySchema = z.object({
  name: z.string().nonempty("Vui lòng nhập tên nhóm."),
  description: z.string().nonempty("Vui lòng nhập mô tả của nhóm."),
  role: z.string().nonempty("Vui lòng nhập vai trò của bạn."),
});

export const UpdateGroupFamilySchema = z.object({
  name: z.string().nonempty("Vui lòng nhập tên nhóm."),
  description: z.string().nonempty("Vui lòng nhập mô tả của nhóm."),
});
