import z from "zod";

export const UserSchema = z.object({
  fullName: z.string().nonempty({ message: "Tên không được để trống" }),
  memorableName: z.string().optional(),
  address: z.string().optional(),
});
