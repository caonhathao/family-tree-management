import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class VerifyGoogleDto {
  @ApiProperty({ example: '<google-token>' })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.GOOGLE_TOKEN })
  token: string;
}
