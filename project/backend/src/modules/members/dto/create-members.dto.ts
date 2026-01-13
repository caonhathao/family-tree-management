import { GENDER } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class MemberDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  fullName: string;

  @IsNotEmpty({ message: InvalidMessageResponse.GENDER_EMPTY })
  gender: GENDER;

  @IsNotEmpty({ message: '' })
  @IsDate()
  dateOfBirth: Date;
  dateOfDeath?: Date;

  isAlive?: boolean;
  biography?: string;
  generation: number;
}
