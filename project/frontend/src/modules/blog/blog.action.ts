"use server";
import { handleError } from "@/lib/util/utils.lib";
import { IBlogDto, IBlogsDto } from "./blog.dto";
import { BlogService } from "./blog.service";
import { headers } from "next/headers";

export async function updateBlogAction(data: IBlogDto) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.updateBlog(data, userId);
    return res as IBlogDto;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function getBlogAction(slug: string) {
  try {
    const res = await BlogService.getBlog(slug);
    return res as IBlogDto;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function getBlogsAction() {
  try {
    const res = await BlogService.getBlogs();
    return res as IBlogsDto[];
  } catch (err: unknown) {
    return handleError(err);
  }
}
