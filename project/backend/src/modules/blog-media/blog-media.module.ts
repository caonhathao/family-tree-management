import { Module } from '@nestjs/common';
import { BlogMediaController } from './blog-media.controller';
import { BlogMediaService } from './blog-media.service';
import { CloudinaryModule } from 'src/common/config/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [BlogMediaController],
  providers: [BlogMediaService],
  exports: [BlogMediaService],
})
export class BlogMediaModule {}
