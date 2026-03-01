import { Exception } from "@/lib/messages/response.messages";
import { BlogUpdateServiceDto } from "./blog.service-validator";
import { prisma } from "@/lib/prisma";
import { OutputBlockData, OutputData } from "@editorjs/editorjs";
import { IBlogDto } from "./blog.dto";
import { safeJsonParse } from "@/lib/util/utils.lib";

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
    //check validation
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

    //check if blog exist
    const blog = await prisma.blog.findUnique({
      where: { slug: data.slug },
      select: { id: true, slug: true, content: true },
    });

    //get title of content
    const content = safeJsonParse(data.content);
    const headerBlock = content.blocks.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (block: OutputBlockData<string, any>) => block.type === "header",
    );
    const extractedTitle = headerBlock
      ? headerBlock.data.text
      : "Tiêu đề mặc định";

    //if the blog data is null, create new
    if (!blog) {
      const mediaUrls = extractMediaUrls(safeJsonParse(data.content as string));
      const result = await prisma.$transaction(async (tx) => {
        const newBlog = await tx.blog.create({
          data: {
            title: extractedTitle,
            slug: data.slug,
            content: data.content as string,
            userId: userId,
          },
          select: { id: true, title: true, slug: true, content: true },
        });
        if (mediaUrls.length > 0) {
          await tx.blogMedia.createMany({
            data: mediaUrls.map((url) => ({
              url,
              isUsed: true,
              blogId: newBlog.id,
            })),
          });
        }
        return newBlog;
      });
      return result as IBlogDto;
    } else {
      const mediaUrls = extractMediaUrls(safeJsonParse(data.content as string));
      console.log(mediaUrls);

      const result = await prisma.$transaction(async (tx) => {
        const updatedBlog = await tx.blog.update({
          where: { slug: data.slug },
          data: {
            title: extractedTitle,
            slug: data.slug,
            content: data.content as string,
          },
          select: { id: true, title: true, slug: true, content: true },
        });

        await Promise.all([
          tx.blogMedia.updateMany({
            where: { url: { in: mediaUrls } },
            data: {
              isUsed: true,
              blogId: updatedBlog.id,
            },
          }),

          tx.blogMedia.updateMany({
            where: {
              blogId: updatedBlog.id,
              url: { notIn: mediaUrls },
            },
            data: {
              isUsed: false,
              blogId: null,
            },
          }),
        ]);

        return updatedBlog;
      });

      return result as IBlogDto;
    }
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
      },
    });

    return blog as IBlogDto;
  } catch (err: unknown) {
    console.log("error at get blog service:", err);
    throw err;
  }
};

export const BlogService = {
  updateBlog,
  getBlog,
};
