import { InvalidMessageResponse } from "@/lib/messages/response.messages";
import z from "zod";

export const BlogUpdateServiceDto = z.object({
  title: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  slug: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  content: z.any(),
});
export type BlogUpdateServiceDto = z.infer<typeof BlogUpdateServiceDto>;
