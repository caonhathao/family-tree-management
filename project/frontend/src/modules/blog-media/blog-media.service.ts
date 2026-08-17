import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";
import { IBlogMediaDto } from "./blog.dto";

const uploadBlogMedia = async (type: string, file?: File) => {
  if (!file) throw new Error("FILE_MISSING");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", JSON.stringify({ type }));

  const res = await apiRequest<IBlogMediaDto>(apiClient.blogMedia.upload, {
    method: "POST",
    formData,
  });

  return res;
};

const cleanupOrphanedMedia = async () => {
  const res = await apiRequest(apiClient.blogMedia.cleanup, {
    method: "DELETE",
  });
  return res.data;
};

export const BlogMediaService = {
  uploadBlogMedia,
  cleanupOrphanedMedia,
};
