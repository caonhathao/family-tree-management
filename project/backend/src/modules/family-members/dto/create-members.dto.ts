import { GENDER } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

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
  gender: GENDER;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @IsNotEmpty({ message: '' })
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Date of death (optional)',
    example: '2020-01-01',
    required: false,
  })
  dateOfDeath?: Date;

  @ApiProperty({
    description: 'Is member alive',
    example: true,
    required: false,
  })
  isAlive?: boolean;

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
