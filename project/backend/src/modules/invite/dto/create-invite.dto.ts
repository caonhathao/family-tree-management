import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class CreateInviteDto {
  @ApiProperty({
    description: 'Group ID to invite to',
    example: 'group123',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  groupId: string;
}
