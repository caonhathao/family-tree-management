import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: false,
  })
  @IsString()
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL_INCORRECT })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: 'newPassword123',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

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
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'User biography',
    example: 'A brief description about the user',
    required: false,
  })
  @IsOptional()
  biography?: string;
}
