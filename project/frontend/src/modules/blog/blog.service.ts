import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";
import { IBlogDto, IBlogsDto } from "./blog.dto";
import { BlogUpdateServiceDto } from "./blog.service-validator";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateBlog = async (data: BlogUpdateServiceDto, _userId: string) => {
  const res = await apiRequest<IBlogDto>(apiClient.blog.upsert, {
    method: "POST",
    body: data,
  });
  return res;
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
  const res = await apiRequest<IBlogsDto[]>(apiClient.blog.list, {
    method: "GET",
    query: { page, limit, filter, filterType },
  });
  return res;
};

const deleteBlog = async (slug: string) => {
  const res = await apiRequest<{ id: string; slug: string }>(
    apiClient.blog.delete(slug),
    { method: "DELETE" },
  );
  return res;
};

export const BlogService = {
  updateBlog,
  getBlog,
  getBlogs,
  deleteBlog,
};
