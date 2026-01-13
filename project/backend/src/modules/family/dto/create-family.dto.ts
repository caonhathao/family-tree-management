import { IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class FamilyDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  name: string;

  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.DESC_EMPTY })
  description: string;
}
