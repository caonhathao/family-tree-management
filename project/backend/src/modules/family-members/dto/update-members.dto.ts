import { GENDER } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class MemberUpdateDto {
  @ApiProperty({
    description: 'Member ID',
    example: 'member123',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;

  @ApiProperty({
    description: 'Member full name',
    example: 'John Doe',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Member gender',
    enum: GENDER,
    example: 'MALE',
  })
  gender: GENDER;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Date of death',
    example: '2020-01-01',
  })
  @IsDate()
  dateOfDeath: Date;

  @ApiProperty({
    description: 'Is member alive',
    example: true,
  })
  isAlive: boolean;

  @ApiProperty({
    description: 'Member biography',
    example: 'A loving father and husband',
    required: false,
  })
  biography?: string;

  @ApiProperty({
    description: 'Generation number',
    example: 1,
  })
  generation: number;
}
