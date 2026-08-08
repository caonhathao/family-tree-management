import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EVENT_TYPE, RECURRENCE_FREQUENCY } from '@prisma/client';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class CreateRecurrenceDto {
  @ApiProperty({ enum: RECURRENCE_FREQUENCY })
  @IsEnum(RECURRENCE_FREQUENCY)
  freq: RECURRENCE_FREQUENCY;

  @ApiPropertyOptional({ description: 'Every N day/week/month', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({ description: 'Stop recurring at this date' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({
    description: 'Total number of occurrences (exclusive with endsAt)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Group family ID' })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  groupId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EVENT_TYPE, default: EVENT_TYPE.OTHER })
  @IsOptional()
  @IsEnum(EVENT_TYPE)
  type?: EVENT_TYPE;

  @ApiProperty({ description: 'Start time (ISO datetime)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time (ISO datetime), must be after startTime',
  })
  @IsDateString()
  endTime: string;

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
