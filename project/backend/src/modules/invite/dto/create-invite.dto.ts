import { IsDate, IsNotEmpty, IsString, IsUUID, MinDate } from 'class-validator';
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

  @ApiProperty({
    description: 'Expiration date for the invitation',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDate()
  @MinDate(new Date())
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  expiresAt: Date;
}
