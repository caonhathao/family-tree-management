import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'User biography',
    example: 'A brief description about the user',
    required: false,
  })
  @IsOptional()
  biography?: string;

  @ApiProperty({
    description: 'User memorable name',
    example: 'Nicky',
    required: false,
  })
  @IsString()
  @IsOptional()
  memorableName?: string;

  @ApiProperty({
    description: 'User address',
    example: 'Ho Chi Minh City',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;
}
