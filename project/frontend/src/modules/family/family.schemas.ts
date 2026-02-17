import { LINEAGE_TYPE } from "@prisma/client";
import z from "zod";

export const FamilySchema = z.object({
  localId: z.string(),
  name: z.string().nonempty({ message: "Thiếu tên gia đình" }),
  description: z.string().optional(),
  lineageType: z.enum(LINEAGE_TYPE, { message: "Thiếu loại gia đình" }),
});
