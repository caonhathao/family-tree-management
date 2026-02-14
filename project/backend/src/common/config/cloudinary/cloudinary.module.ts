import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { EnvConfigModule } from '../env/env-config.module';

export const CLOUDINARY_PROVIDER = 'CLOUDINARY';

@Module({
  imports: [EnvConfigModule],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
