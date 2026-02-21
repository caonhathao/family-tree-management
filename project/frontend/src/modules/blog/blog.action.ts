"use server";
import { handleError } from "@/lib/util/utils.lib";
import {
  IBlogDetailDto,
  IBlogResponseDto,
  ICreateBlogDto,
  IUpdateBlogDto,
} from "./blog.dto";
import { BlogService } from "./blog.service";
import { headers } from "next/headers";

export async function createBlogAction(data: ICreateBlogDto) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.createBlog(data, userId);
    return res as IBlogResponseDto;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function updateBlogAction(data: IUpdateBlogDto) {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const res = await BlogService.updateBlog(data, userId);
    return res as IBlogResponseDto;
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function getBlogAction(slug: string) {
  try {
    const res = await BlogService.getBlog(slug);
    return res as IBlogDetailDto;
  } catch (err: unknown) {
    return handleError(err);
  }
}
