import { GENDER } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';
import { Type } from 'class-transformer';

export class MemberUpdateDto {
  @ApiProperty({
    description: 'Member ID',
    example: 'member123',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  memberId: string;

  @ApiProperty({
    description: 'Member full name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'Member gender',
    enum: GENDER,
    example: 'MALE',
  })
  @IsOptional()
  @IsEnum(GENDER, {
    message: `Gender must be one of the following values: ${Object.values(GENDER).join(', ')}`,
  })
  gender?: GENDER;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Date of death',
    example: '2020-01-01',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfDeath: Date;

  @ApiProperty({
    description: 'Is member alive',
    example: true,
  })
  @IsOptional()
  isAlive: boolean;

  @ApiProperty({
    description: 'Member biography',
    example: 'A loving father and husband',
    required: false,
  })
  @IsOptional()
  biography?: string;

  @ApiProperty({
    description: 'Generation number',
    example: 1,
  })
  @IsOptional()
  generation: number;
}
