import { BLOG_MEDIA_TYPE } from "@prisma/client";

export interface IBlogMediaDto {
  id: string;
  type: BLOG_MEDIA_TYPE;
  url: string;
}
