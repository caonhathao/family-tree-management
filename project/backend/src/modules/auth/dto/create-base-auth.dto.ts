import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class CreateBaseAuthDto {
  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.PASSWORD_MIN })
  confirmPassword: string;
}
