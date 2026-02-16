
import { z } from 'zod';

export const LoginBaseDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginBaseDto = z.infer<typeof LoginBaseDto>;
