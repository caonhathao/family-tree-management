import { IsDate, IsEmail, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UserUpdateDto {
  @IsString()
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL_INCORRECT })
  email?: string;

  @IsString()
  password?: string;

  @IsString()
  fullName?: string;

  @IsDate()
  dateOfBirth?: Date;

  @IsString()
  biography?: string;
}
