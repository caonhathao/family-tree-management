import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EVENT_TYPE } from '@prisma/client';
import { CreateRecurrenceDto } from './create-event.dto';

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EVENT_TYPE })
  @IsOptional()
  @IsEnum(EVENT_TYPE)
  type?: EVENT_TYPE;

  @ApiPropertyOptional({ description: 'Start time (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time (ISO datetime), must be after startTime',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ type: CreateRecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurrenceDto)
  recurrence?: CreateRecurrenceDto;
}
