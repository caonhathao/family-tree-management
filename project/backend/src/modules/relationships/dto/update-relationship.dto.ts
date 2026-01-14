import { TYPE_RELATIONSHIP } from '@prisma/client';
import { IsString, IsNotEmpty } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RelationshipUpdateDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  fromMemberId?: string;
  toMemberId?: string;

  type?: TYPE_RELATIONSHIP;
}
