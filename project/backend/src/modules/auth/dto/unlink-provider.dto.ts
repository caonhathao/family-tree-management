import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UnlinkProviderDto {
  @ApiProperty({ example: 'uuid-of-account' })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  accountId: string;
}
