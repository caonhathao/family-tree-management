import { InvalidMessageResponse } from "@/lib/messages/response.messages";
import z from "zod";

export const BlogCreateServiceDto = z.object({
  title: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  slug: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  content: z
    .string()
    .nonempty({ message: InvalidMessageResponse.CONTENT_EMPTY }),
});
export type BlogCreateServiceDto = z.infer<typeof BlogCreateServiceDto>;

export const BlogUpdateServiceDto = z.object({
  blogId: z.string().nonempty({ message: InvalidMessageResponse.ID_EMPTY }),
  title: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  slug: z.string().nonempty({ message: InvalidMessageResponse.FIELD_EMPTY }),
  content: z.any(),
});
export type BlogUpdateServiceDto = z.infer<typeof BlogUpdateServiceDto>;
