import { BadRequestException, Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { EnvConfigService } from '../env/env-config.service';
import { Readable } from 'node:stream';

@Injectable()
export class CloudinaryService {
  constructor(private envConfig: EnvConfigService) {
    cloudinary.config({
      secure: true,
      cloud_name: this.envConfig.cloudinaryName,
      api_key: this.envConfig.cloudinaryApiKey,
      api_secret: this.envConfig.cloudinaryApiSecret,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('File is missing');
    }
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: folderName },
        (error, result) => {
          if (result) resolve(result);
          return reject(new Error('Upload result is undefined'));
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }
}
