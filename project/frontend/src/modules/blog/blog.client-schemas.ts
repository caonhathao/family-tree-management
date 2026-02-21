import { InvalidMessageResponse } from "@/lib/messages/response.messages";
import z from "zod";

export const BlogSchema = z.object({
  title: z.string({ message: InvalidMessageResponse.FIELD_EMPTY }),
  slug: z.string({ message: InvalidMessageResponse.FIELD_EMPTY }),
  content: z.string({ message: InvalidMessageResponse.CONTENT_EMPTY }),
});
