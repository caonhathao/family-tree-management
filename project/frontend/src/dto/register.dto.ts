import { InvalidMessageResponse } from "@/lib/messages/response.messages";
import { z } from "zod";

export const RegisterDto = z.object({
  email: z.string().email({ message: InvalidMessageResponse.EMAIL }),
  password: z.string().min(6, { message: InvalidMessageResponse.PASSWORD_MIN }),
  fullName: z
    .string()
    .trim()
    .min(2, { message: InvalidMessageResponse.NAME_MIN })
    .max(100, { message: InvalidMessageResponse.NAME_MAX }),
});

export type RegisterDto = z.infer<typeof RegisterDto>;
