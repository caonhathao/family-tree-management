import { IsEmail, IsNotEmpty, IsString, Min } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RegisterDto {
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;

  @IsString()
  @Min(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;

  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  fullName: string;
}
