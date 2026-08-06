import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';
import { BLOG_MEDIA_TYPE } from '@prisma/client';

export class UploadBlogMediaDto {
  @ApiProperty({
    description: 'Type of blog media',
    enum: BLOG_MEDIA_TYPE,
    example: BLOG_MEDIA_TYPE.IMAGE,
    required: true,
  })
  @IsEnum(BLOG_MEDIA_TYPE, { message: InvalidMessageResponse.FIELD_EMPTY })
  type: BLOG_MEDIA_TYPE;
}
