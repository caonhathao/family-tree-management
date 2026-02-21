import { MEMBER_ROLE } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UpdateGroupMemberDto {
  @ApiProperty({
    description: 'Member ID to update',
    example: 'member123',
  })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  id: string;

  @ApiProperty({
    description: 'New role for the member',
    enum: MEMBER_ROLE,
    example: 'EDITOR',
    required: false,
  })
  @IsOptional()
  role?: MEMBER_ROLE;
}
