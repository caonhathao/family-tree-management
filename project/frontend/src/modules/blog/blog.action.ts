"use server";
import { IBlogDto, IBlogList, IBlogsDto } from "./blog.dto";
import { BlogService } from "./blog.service";
import { headers } from "next/headers";
import { IPaginationBase } from "@/types/base.types";
import { cache } from "react";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";

export async function updateBlogAction(
  data: IBlogDto,
): Promise<IBlogDto | ApiResponse<IBlogDto, unknown>> {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.updateBlog(data, userId);
    return res as IBlogDto;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getBlogAction(
  slug: string,
): Promise<IBlogDto | ApiResponse<IBlogDto, unknown>> {
  try {
    const res = await BlogService.getBlog(slug);
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
  ): Promise<
    IPaginationBase<IBlogsDto[]> | ApiResponse<IBlogsDto[], unknown>
  > => {
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
      return res as IPaginationBase<IBlogsDto[]>;
    } catch (err: unknown) {
      return ResponseFactory.handleError(err);
    }
  },
);
