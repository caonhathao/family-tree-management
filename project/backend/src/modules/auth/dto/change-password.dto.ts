import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class ChangePasswordDto {
  @ApiProperty({ example: 'old-password' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.PASSWORD_INCORRECT })
  oldPassword: string;

  @ApiProperty({ example: 'new-password' })
  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  newPassword: string;

  @ApiProperty({ example: 'new-password' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.PASSWORD_MIN })
  confirmPassword: string;
}
