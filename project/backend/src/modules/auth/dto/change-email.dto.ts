import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new@email.com' })
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  newEmail: string;

  @ApiProperty({ example: 'current-password' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.PASSWORD_INCORRECT })
  password: string;
}
