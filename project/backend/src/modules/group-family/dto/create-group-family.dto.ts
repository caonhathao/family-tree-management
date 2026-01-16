import { USER_ROLE } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupFamilyDto {
  @ApiProperty({
    description: 'Group family name',
    example: 'Johnson Family Group',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Group family description',
    example: 'A group for the Johnson family members',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'User role in the group',
    enum: USER_ROLE,
    example: 'OWNER',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: USER_ROLE;
}
