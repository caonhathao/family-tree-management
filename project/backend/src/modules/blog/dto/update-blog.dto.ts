import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UpdateBlogDto {
  @ApiProperty({
    description: 'Blog title (auto-extracted from content header if empty)',
    example: 'Welcome to my blog',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Blog slug',
    example: 'welcome-to-my-blog',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  slug: string;

  @ApiProperty({
    description: 'Blog content (EditorJS JSON string)',
    required: true,
  })
  @Allow()
  content: string;
}
