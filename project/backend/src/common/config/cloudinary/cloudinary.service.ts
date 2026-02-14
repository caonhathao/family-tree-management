import { BadRequestException, Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'node:stream';
import { Exception } from 'src/common/messages/messages.response';

@Injectable()
export class CloudinaryService {
  constructor() {}

  async uploadFile(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException(Exception.FILE_MISSING);
    }
    if (!file.buffer) {
      throw new BadRequestException(Exception.FILE_BUFFER_MISSING);
    }
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: folderName },
        (error, result) => {
          if (result) resolve(result);
          return reject(new Error(Exception.UPLOAD_FAILED));
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }
  async destroyFile(
    url: string | undefined,
    folderName: string,
  ): Promise<{ result: string }> {
    if (!url) {
      throw new BadRequestException(Exception.URL_MISSING);
    }
    if (url.length === 0) throw new BadRequestException(Exception.URL_MISSING);
    const publidId = folderName + this.getPublicId(url);
    return (await cloudinary.uploader.destroy(publidId)) as { result: string };
  }

  private getPublicId(url: string): string {
    const lastSlashIdx = url.lastIndexOf('/');
    const lastDotIdx = url.lastIndexOf('.');
    return url.substring(lastSlashIdx, lastDotIdx);
  }
}
