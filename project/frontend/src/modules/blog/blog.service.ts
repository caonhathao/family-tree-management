import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";
import { IBlogDto, IBlogList } from "./blog.dto";
import { BlogUpdateServiceDto } from "./blog.service-validator";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateBlog = async (data: BlogUpdateServiceDto, _userId: string) => {
  const res = await apiRequest<IBlogDto>(apiClient.blog.upsert, {
    method: "POST",
    body: data,
  });
  return res.data;
};

const getBlog = async (slug: string) => {
  const res = await apiRequest<IBlogDto>(apiClient.blog.get(slug), {
    method: "GET",
  });
  return res;
};

const getBlogs = async (
  _userId: string,
  page?: number,
  limit?: number,
  filter?: string,
  filterType?: string,
) => {
  const res = await apiRequest<{
    data: IBlogList[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  }>(apiClient.blog.list, {
    method: "GET",
    query: { page, limit, filter, filterType },
  });
  return res.data;
};

export const BlogService = {
  updateBlog,
  getBlog,
  getBlogs,
};
