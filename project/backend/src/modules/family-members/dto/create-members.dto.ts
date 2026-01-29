import { GENDER } from '@prisma/client';
import {
  IsDate,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';
import { Type } from 'class-transformer';

export class MemberDto {
  @ApiProperty({
    description: 'Family ID',
    example: 'family123',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  @ApiProperty({
    description: 'Member full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  fullName: string;

  @ApiProperty({
    description: 'Member gender',
    enum: GENDER,
    example: 'MALE',
  })
  @IsNotEmpty({ message: InvalidMessageResponse.GENDER_EMPTY })
  @IsEnum(GENDER, {
    message: `Gender must be one of the following values: ${Object.values(GENDER).join(', ')}`,
  })
  gender: GENDER;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty({ message: '' })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Date of death (optional)',
    example: '2020-01-01',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfDeath?: Date;

  @ApiProperty({
    description: 'Is member alive',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAlive?: boolean;

  @ApiProperty({
    description: 'Member biography',
    example: 'A loving father and husband',
    required: false,
  })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({
    description: 'Generation number',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  generation: number;
}
