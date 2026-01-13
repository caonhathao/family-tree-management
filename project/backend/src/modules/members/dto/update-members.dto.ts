import { GENDER } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class MemberUpdateDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;

  @IsString()
  fullName: string;

  gender: GENDER;
  @IsDate()
  dateOfBirth: Date;
  @IsDate()
  dateOfDeath: Date;

  isAlive: boolean;
  biography?: string;
  generation: number;
}
