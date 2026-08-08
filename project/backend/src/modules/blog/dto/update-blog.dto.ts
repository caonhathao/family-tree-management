import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UpdateBlogDto {
  @ApiProperty({
    description: 'Blog title',
    example: 'Welcome to my blog',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  title: string;

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
