import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class LoginBaseDto {
  @ApiProperty({ example: 'abc@gmail.com' })
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;
}
