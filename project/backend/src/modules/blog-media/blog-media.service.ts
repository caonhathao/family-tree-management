import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Exception } from 'src/common/messages/messages.response';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { BLOG_MEDIA_TYPE } from '@prisma/client';

@Injectable()
export class BlogMediaService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private envConfig: EnvConfigService,
  ) {}

  async upload(file: Express.Multer.File, type: string) {
    try {
      if (!file) throw new BadRequestException(Exception.FILE_MISSING);

      const upload = await this.cloudinaryService.uploadFile(
        file,
        this.envConfig.folderBlogName,
      );

      if (!('secure_url' in upload) || !upload.secure_url) {
        throw new BadRequestException(Exception.UPLOAD_FAILED);
      }

      return await this.prisma.blogMedia.create({
        data: {
          url: upload.secure_url as string,
          type: type as BLOG_MEDIA_TYPE,
        },
        select: {
          id: true,
          url: true,
          type: true,
        },
      });
    } catch (err) {
      console.log('error at upload blog media service:', err);
      throw err;
    }
  }

  async cleanup() {
    try {
      const orphanedMedia = await this.prisma.blogMedia.findMany({
        where: {
          isUsed: false,
        },
        select: {
          id: true,
          url: true,
        },
      });

      for (const media of orphanedMedia) {
        await this.cloudinaryService.destroyFile(
          media.url,
          this.envConfig.folderBlogName,
        );
      }

      return await this.prisma.blogMedia.deleteMany({
        where: { id: { in: orphanedMedia.map((m) => m.id) } },
      });
    } catch (err) {
      console.log('error at cleanup blog media service:', err);
      throw err;
    }
  }
}
