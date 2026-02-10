import z from "zod";

export const RelationshipSchema = z
  .object({
    localId: z.string(),
    fromMemberId: z.string().nonempty({ message: "Thiếu id thành viên" }),
    toMemberId: z.string().nonempty({ message: "Thiếu id thành viên" }),
    type: z.string().nonempty({ message: "Thiếu loại quan hệ" }),
  })
  .refine((data) => data.fromMemberId !== data.toMemberId, {
    message: "Không được tạo mối quan hệ tự thân.",
    path: ["toMemberId"],
  });
