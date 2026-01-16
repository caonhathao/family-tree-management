import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class VerifiOtpDto {
  @ApiProperty({ example: 'abc@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: InvalidMessageResponse.OTP_MIN })
  code: string;
}
