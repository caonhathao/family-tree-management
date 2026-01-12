import { IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.GOOGLE_TOKEN })
  token: string;
}
