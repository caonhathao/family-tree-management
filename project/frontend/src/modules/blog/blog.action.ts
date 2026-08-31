"use server";
import { IBlogDeleted, IBlogDto, IBlogsDto } from "./blog.dto";
import { BlogService } from "./blog.service";
import { headers } from "next/headers";
import { cache } from "react";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";

export async function updateBlogAction(
  data: IBlogDto,
): Promise<ApiResponse<IBlogDto, unknown>> {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.updateBlog(data, userId);
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getBlogAction(
  slug: string,
): Promise<ApiResponse<IBlogDto, unknown>> {
  try {
    const res = await BlogService.getBlog(slug);
    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export async function deleteBlogAction(
  slug: string,
): Promise<ApiResponse<IBlogDeleted, unknown>> {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.deleteBlog(slug);
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export const getBlogsAction = cache(
  async (
    page?: number,
    limit?: number,
    filterType?: string,
    filter?: string,
  ): Promise<ApiResponse<IBlogsDto[], unknown>> => {
    try {
      const headerList = await headers();
      const currentUserId = headerList.get("X-User-Id");
      if (!currentUserId) {
        throw new Error("Unauthorized");
      }
      const res = await BlogService.getBlogs(
        currentUserId,
        page,
        limit,
        filter,
        filterType,
      );
      return res;
    } catch (err: unknown) {
      return ResponseFactory.handleError(err);
    }
  },
);
