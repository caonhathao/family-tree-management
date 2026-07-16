import {
  destroyFile,
  uploadFile,
} from "@/configs/cloudinary/cloudinary.service";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { Exception } from "@/lib/messages/response.messages";
import { prisma } from "@/lib/prisma";
import { BLOG_MEDIA_TYPE } from "@prisma/client";
import { IBlogMediaDto } from "./blog.dto";
import { ResponseFactory } from "@/lib/res/response.factory";

const uploadBlogMedia = async (type: string, file?: File) => {
  try {
    if (!file) throw new Error(Exception.FILE_MISSING);

    const upload = await uploadFile(file, EnvConfig.FolderBlog);
    if (!upload) throw new Error(Exception.UPLOAD_FAILED);

    const newBlogMedia = await prisma.blogMedia.create({
      data: {
        url: upload.url,
        type: type as BLOG_MEDIA_TYPE,
      },
      select: {
        id: true,
        url: true,
        type: true,
      },
    });
    return newBlogMedia as IBlogMediaDto;
  } catch (err) {
    console.error("error at  upload media:", err);
    return ResponseFactory.handleError(err);
  }
};

const cleanupOrphanedMedia = async () => {
  try {
    const orphanedMedia = await prisma.blogMedia.findMany({
      where: {
        isUsed: false,
      },
      select: {
        id: true,
        url: true,
      },
    });
    for (const media of orphanedMedia) {
      await destroyFile(media.url, EnvConfig.FolderBlog);
    }
    return await prisma.blogMedia.deleteMany({
      where: { id: { in: orphanedMedia.map((m) => m.id) } },
    });
  } catch (err) {
    console.error("error at cleanup media:", err);
    return ResponseFactory.handleError(err);
  }
};

export const BlogMediaService = {
  uploadBlogMedia,
  cleanupOrphanedMedia,
};
