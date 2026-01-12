import { IsEmail, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class LoginBaseDto {
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;

  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;
}
