import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupFamilyDto {
  @ApiProperty({
    description: 'Group family name',
    example: 'Johnson Family Group',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Group family description',
    example: 'A group for the Johnson family members',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
