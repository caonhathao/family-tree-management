
import { z } from 'zod';

export const GoogleLoginDto = z.object({
  token: z.string(),
});

export type GoogleLoginDto = z.infer<typeof GoogleLoginDto>;
