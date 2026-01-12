import { IsEmail, IsString, Length } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class VerifiOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: InvalidMessageResponse.OTP_MIN })
  code: string;
}
