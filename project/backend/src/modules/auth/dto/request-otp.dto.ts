import { IsEmail } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RequestOtpDto {
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;
}
