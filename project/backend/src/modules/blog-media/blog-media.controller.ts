import {
  Body,
  Controller,
  Delete,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AtGuard } from '../auth/guards/auth.guard';
import { BlogMediaService } from './blog-media.service';
import { UploadBlogMediaDto } from './dto/upload-blog-media.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { HttpStatus } from 'src/common/constants/api';

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 2;

@ApiTags('blog-media')
@ApiBearerAuth()
@Controller('blog-media')
@UseGuards(AtGuard)
export class BlogMediaController {
  constructor(private readonly blogMediaService: BlogMediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a blog media file' })
  @ApiResponse({
    status: 201,
    description: 'Blog media uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadBlogMedia(
    @Body() data: UploadBlogMediaDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const media = await this.blogMediaService.upload(file, data.type);
    return ResponseFactory.success({
      data: media,
      code: HttpStatus.CREATED,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Clean up orphaned blog media' })
  @ApiResponse({
    status: 200,
    description: 'Orphaned blog media cleaned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupOrphanedMedia() {
    const result = await this.blogMediaService.cleanup();
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.DELETED,
    });
  }
}
