import { IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class FamilyUpdateDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;

  name: string | undefined;
  description: string | undefined;

  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  ownerId: string | undefined;
}
