"use server";
import { handleError } from "@/lib/util/utils.lib";
import { BlogMediaService } from "./blog-media.service";

export async function uploadBlogMediaAction(type: string, file?: File) {
  try {
    const res = await BlogMediaService.uploadBlogMedia(type, file);
    return res;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function cleanupOrphanedMediaAction() {
  try {
    const res = await BlogMediaService.cleanupOrphanedMedia();
    return res;
  } catch (err: unknown) {
    return handleError(err);
  }
}
