import { TYPE_RELATIONSHIP } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RelationshipCreateDto {
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
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  fromMemberId: string;

  @ApiProperty({
    description: 'Target member ID',
    example: 'member456',
  })
  toMemberId: string;

  @ApiProperty({
    description: 'Type of relationship',
    enum: TYPE_RELATIONSHIP,
    example: 'PARENT',
  })
  type: TYPE_RELATIONSHIP;
}
