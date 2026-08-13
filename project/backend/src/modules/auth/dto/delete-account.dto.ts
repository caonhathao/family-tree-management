import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class DeleteAccountDto {
  @ApiProperty({ example: 'your-password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: InvalidMessageResponse.PASSWORD_MIN })
  password?: string;
}
