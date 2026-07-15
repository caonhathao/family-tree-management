import z from "zod";

export const UserSchema = z.object({
  fullName: z.string().nonempty({ message: "Tên không được để trống" }),
  memorableName: z.string({ message: "Phải là kí tự chữ cái" }),
  address: z.string({ message: "Phải là chuỗi kí tự chữ cái" }),
});
