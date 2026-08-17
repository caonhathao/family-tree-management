import { BLOG_MEDIA_TYPE } from "@/types/enums";

export interface IBlogMediaDto {
  id: string;
  type: BLOG_MEDIA_TYPE;
  url: string;
}
