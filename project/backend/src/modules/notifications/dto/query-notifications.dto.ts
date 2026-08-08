import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by group family ID' })
  @IsOptional()
  @IsUUID('all')
  groupId?: string;

  @ApiPropertyOptional({ description: 'Filter by read state' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
