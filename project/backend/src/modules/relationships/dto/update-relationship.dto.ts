import { TYPE_RELATIONSHIP } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RelationshipUpdateDto {
  @ApiProperty({
    description: 'Family ID',
    example: 'family123',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  @ApiProperty({
    description: 'Source member ID',
    example: 'member123',
    required: false,
  })
  @IsOptional()
  fromMemberId?: string;

  @ApiProperty({
    description: 'Target member ID',
    example: 'member456',
    required: false,
  })
  @IsOptional()
  toMemberId?: string;

  @ApiProperty({
    description: 'Type of relationship',
    enum: TYPE_RELATIONSHIP,
    example: 'PARENT',
    required: false,
  })
  @IsEnum(TYPE_RELATIONSHIP)
  @IsOptional()
  type?: TYPE_RELATIONSHIP;
}
