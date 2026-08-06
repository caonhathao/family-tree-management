import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Exception } from 'src/common/messages/messages.response';
import { Prisma, USER_ROLE } from '@prisma/client';

interface EditorBlock {
  type: string;
  data: {
    text?: string;
    file?: { url?: string };
    embed?: string;
  };
}

interface EditorData {
  blocks: EditorBlock[];
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async update(data: UpdateBlogDto, userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) throw new NotFoundException(Exception.NOT_EXIST);
      if (user.role !== USER_ROLE.ADMIN)
        throw new ForbiddenException(Exception.PEMRISSION);

      const blog = await this.prisma.blog.findUnique({
        where: { slug: data.slug },
        select: { id: true, slug: true, content: true },
      });

      const content = this.safeJsonParse(data.content);
      const headerBlock = content.blocks.find(
        (block: EditorBlock) => block.type === 'header',
      );
      const extractedTitle = headerBlock
        ? (headerBlock.data.text ?? '')
        : 'Tiêu đề mặc định';
      const mediaUrls = this.extractMediaUrls(content);

      if (!blog) {
        const result = await this.prisma.$transaction(async (tx) => {
          const newBlog = await tx.blog.create({
            data: {
              title: extractedTitle,
              slug: data.slug,
              content: data.content,
              userId: userId,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
            },
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
        return result;
      } else {
        const result = await this.prisma.$transaction(async (tx) => {
          const updatedBlog = await tx.blog.update({
            where: { slug: data.slug },
            data: {
              title: extractedTitle,
              slug: data.slug,
              content: data.content,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
            },
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
        return result;
      }
    } catch (err) {
      console.log('error at update blog service:', err);
      throw err;
    }
  }

  async getOne(slug: string) {
    try {
      return await this.prisma.blog.findUnique({
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
    } catch (err) {
      console.log('error at get blog service:', err);
      throw err;
    }
  }

  async getAll(
    userId: string,
    page?: number,
    limit?: number,
    filter?: string,
    filterType?: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });
      if (!user) throw new NotFoundException(Exception.NOT_EXIST);
      if (user.role !== USER_ROLE.ADMIN)
        throw new ForbiddenException(Exception.PEMRISSION);

      const whereClause: Prisma.BlogWhereInput = {};
      if (filter && filterType) {
        if (filterType === 'slug') {
          whereClause.slug = { contains: filter, mode: 'insensitive' };
        }
        if (filterType === 'title') {
          whereClause.title = { contains: filter, mode: 'insensitive' };
        }
      }

      const currentPage = page && page > 0 ? page : 1;
      const pageSize = limit && limit > 0 ? limit : 10;
      const skip = (currentPage - 1) * pageSize;

      const [totalCount, blogs] = await this.prisma.$transaction([
        this.prisma.blog.count({ where: whereClause }),
        this.prisma.blog.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: skip,
          take: pageSize,
          orderBy: { id: 'asc' },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: blogs,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: currentPage,
          pageSize: pageSize,
        },
      };
    } catch (err) {
      console.log('error at get blogs service:', err);
      throw err;
    }
  }

  private extractMediaUrls(data: EditorData): string[] {
    const urls: string[] = [];
    data.blocks.forEach((block) => {
      if (block.type === 'image') {
        if (block.data.file && block.data.file.url) {
          urls.push(block.data.file.url);
        }
      } else if (block.type === 'embed') {
        if (block.data.embed) {
          urls.push(block.data.embed);
        }
      }
    });
    return urls;
  }

  private safeJsonParse(value: string): EditorData {
    try {
      return JSON.parse(value) as EditorData;
    } catch {
      return { blocks: [] };
    }
  }
}
