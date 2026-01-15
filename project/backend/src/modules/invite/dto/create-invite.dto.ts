import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  groupId: string;

  @IsDate()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  expiresAt: Date;
}
