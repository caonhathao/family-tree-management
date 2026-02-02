import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc@email.com' })
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;
}
