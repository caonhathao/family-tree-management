"use server";
import { ResponseFactory } from "@/lib/res/response.factory";
import { BlogMediaService } from "./blog-media.service";
import { IBlogMediaDto } from "./blog.dto";
import { ApiResponse } from "@/types/api.types";

export async function uploadBlogMediaAction(
  type: string,
  file?: File,
): Promise<IBlogMediaDto | ApiResponse<IBlogMediaDto>> {
  try {
    const res = await BlogMediaService.uploadBlogMedia(type, file);

    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function cleanupOrphanedMediaAction() {
  try {
    const res = await BlogMediaService.cleanupOrphanedMedia();
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}
