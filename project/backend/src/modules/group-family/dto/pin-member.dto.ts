import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class PinMemberDto {
  @ApiProperty({
    description: 'Family member ID to pin to, or null to unpin',
    example: 'uuid-string',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @IsOptional()
  familyMemberId?: string | null;
}
