import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class FamilyUpdateDto {
  @ApiProperty({
    description: 'Family ID',
    example: 'family123',
  })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;

  @ApiProperty({
    description: 'Family name (optional)',
    example: 'Johnson Family',
    required: false,
  })
  @IsOptional()
  name: string | undefined;

  @ApiProperty({
    description: 'Family description (optional)',
    example: 'A loving family of four',
    required: false,
  })
  @IsOptional()
  description: string | undefined;

  @ApiProperty({
    description: 'Owner ID (optional)',
    example: 'user456',
    required: false,
  })
  @IsString()
  @IsOptional()
  ownerId: string | undefined;
}
