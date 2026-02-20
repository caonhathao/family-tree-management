import { z } from "zod";

export const CreateInviteDtoSchema = z.object({
  groupId: z.string().uuid(),
});

export type CreateInviteDto = z.infer<typeof CreateInviteDtoSchema>;
