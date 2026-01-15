import { USER_ROLE } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UpdateGroupMemberDto {
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;
  @IsOptional()
  role?: USER_ROLE;
}
