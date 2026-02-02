import z from "zod";

export const RegisterSchema = z
  .object({
    email: z.string().email("Vui lòng nhập đúng định dạng email"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
    fullName: z.string().nonempty("Vui lòng nhập tên của bạn"),
    confirmPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Vui lòng nhập đúng định dạng email"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
});
