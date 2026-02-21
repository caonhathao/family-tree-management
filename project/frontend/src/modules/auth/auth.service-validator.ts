import { InvalidMessageResponse } from "@/lib/messages/response.messages";
import { z } from "zod";

export const RegisterServiceDto = z.object({
  email: z.string().email({ message: InvalidMessageResponse.EMAIL }),
  password: z.string().min(6, { message: InvalidMessageResponse.PASSWORD_MIN }),
  fullName: z
    .string()
    .trim()
    .min(2, { message: InvalidMessageResponse.NAME_MIN })
    .max(100, { message: InvalidMessageResponse.NAME_MAX }),
});
export type RegisterServiceDto = z.infer<typeof RegisterServiceDto>;

export const LoginBaseDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginBaseDto = z.infer<typeof LoginBaseDto>;

export const GoogleLoginDto = z.object({
  token: z.string(),
});
export type GoogleLoginDto = z.infer<typeof GoogleLoginDto>;
