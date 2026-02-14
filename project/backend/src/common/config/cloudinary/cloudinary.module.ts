// src/common/config/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';
import { EnvConfigModule } from '../env/env-config.module';
import { EnvConfigService } from '../env/env-config.service';

export const CLOUDINARY_PROVIDER = 'CLOUDINARY';

@Module({
  imports: [EnvConfigModule],
  providers: [
    CloudinaryService,
    {
      provide: CLOUDINARY_PROVIDER,
      useFactory: (envConfig: EnvConfigService) => {
        return cloudinary.config({
          secure: true,
          cloud_name: envConfig.cloudinaryName,
          api_key: envConfig.cloudinaryApiKey,
          api_secret: envConfig.cloudinaryApiSecret,
        });
      },
      inject: [EnvConfigService],
    },
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
