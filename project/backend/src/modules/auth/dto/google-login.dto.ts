import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.GOOGLE_TOKEN })
  @ApiProperty({ example: '<google-token>' })
  token: string;
}

export class GooglePayloadDto {
  @IsString()
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL })
  @ApiProperty({ example: 'abc@gmail.com' })
  email: string;
  @IsString()
  @ApiProperty({ example: 'abc' })
  name: string;
  @IsString()
  @ApiProperty({ example: 'abc' })
  picture: string;
}
