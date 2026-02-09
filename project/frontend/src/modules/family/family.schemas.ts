import z from "zod";

export const FamilySchema = z.object({
  localId: z.string(),
  name: z.string().nonempty({ message: "Thiếu tên gia đình" }),
  description: z.string().optional(),
});
