import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RegisterDto {
  @ApiProperty({ example: 'abc@gmail.com' })
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password: string;

  @ApiProperty({ example: 'John Deep' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  @MinLength(2, { message: InvalidMessageResponse.NAME_MIN })
  @MaxLength(100, { message: InvalidMessageResponse.NAME_MAX })
  fullName: string;
}
