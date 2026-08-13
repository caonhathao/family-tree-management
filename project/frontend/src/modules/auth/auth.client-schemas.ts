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

export const NewBaseAuthSchema = z.object({
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
  confirmPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
});

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
    confirmPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu cũ",
    path: ["newPassword"],
  });

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email("Vui lòng nhập đúng định dạng email"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
});

export const VerifyPasswordSchema = z.object({
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự"),
});
