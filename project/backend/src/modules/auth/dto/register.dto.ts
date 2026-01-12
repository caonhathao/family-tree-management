import { USER_ROLE } from '@prisma/client';
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

  @IsNotEmpty({ message: InvalidMessageResponse.ROLE_EMPTY })
  role: USER_ROLE;
}
