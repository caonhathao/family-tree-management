import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class VerifyPasswordDto {
  @ApiProperty({ example: 'your-password' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.PASSWORD_INCORRECT })
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;
}
