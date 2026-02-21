import { MEMBER_ROLE } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class CreateGroupFamilyDto {
  @ApiProperty({
    description: 'Group family name',
    example: 'Johnson Family Group',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  @MinLength(6, { message: InvalidMessageResponse.NAME_MIN })
  @MaxLength(30, { message: InvalidMessageResponse.NAME_MAX })
  name: string;

  @ApiProperty({
    description: 'Group family description',
    example: 'A group for the Johnson family members',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'User role in the group',
    enum: MEMBER_ROLE,
    example: 'OWNER',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(MEMBER_ROLE)
  role?: MEMBER_ROLE;
}
