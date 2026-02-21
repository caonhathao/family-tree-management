import { Exception } from "@/lib/messages/response.messages";
import {
  BlogCreateServiceDto,
  BlogUpdateServiceDto,
} from "./blog.service-validator";
import { prisma } from "@/lib/prisma";
import { OutputData } from "@editorjs/editorjs";
import { IBlogDetailDto } from "./blog.dto";

const createBlog = async (data: BlogCreateServiceDto, userId: string) => {
  try {
    //check validation
    //check user's role
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      throw new Error(Exception.NOT_EXIST);
    }

    if (user.role !== "ADMIN") throw new Error(Exception.PEMRISSION);

    const newBlog = await prisma.blog.create({
      data: {
        userId: userId,
        slug: data.slug,
        title: data.title,
        content: data.content,
      },
      select: {
        id: true,
      },
    });
    return newBlog;
  } catch (err: unknown) {
    console.log("error at create blog service:", err);
    throw err;
  }
};

const extractMediaUrls = (data: OutputData): string[] => {
  const urls: string[] = [];
  data.blocks.forEach((block) => {
    if (block.type === "image") {
      if (block.data.file && block.data.file.url) {
        urls.push(block.data.file.url);
      }
    } else if (block.type === "embed") {
      if (block.data.embed) {
        urls.push(block.data.embed);
      }
    }
  });
  return urls;
};

const updateBlog = async (data: BlogUpdateServiceDto, userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new Error(Exception.NOT_EXIST);
    }
    if (user.role !== "ADMIN") {
      throw new Error(Exception.PEMRISSION);
    }

    const blog = await prisma.blog.findUnique({
      where: { id: data.blogId },
      select: { id: true },
    });

    if (!blog) {
      throw new Error(Exception.NOT_EXIST);
    }

    const mediaUrls = extractMediaUrls(JSON.parse(data.content as string));

    const result = await prisma.$transaction(async (tx) => {
      const updatedBlog = await tx.blog.update({
        where: { id: data.blogId },
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content as string, // Already stringified from the client
        },
        select: { id: true },
      });

      if (mediaUrls.length > 0) {
        await tx.blogMedia.updateMany({
          where: {
            url: {
              in: mediaUrls,
            },
          },
          data: {
            isUsed: true,
            blogId: data.blogId,
          },
        });
      }

      return updatedBlog;
    });

    return result;
  } catch (err: unknown) {
    console.log("error at update blog service:", err);
    throw err;
  }
};

const getBlog = async (slug: string) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return blog as IBlogDetailDto;
  } catch (err: unknown) {
    console.log("error at get blog service:", err);
    throw err;
  }
};

export const BlogService = {
  createBlog,
  updateBlog,
  getBlog,
};
