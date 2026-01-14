import { TYPE_RELATIONSHIP } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class RelationshipCreateDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  fromMemberId: string;
  toMemberId: string;

  type: TYPE_RELATIONSHIP;
}
