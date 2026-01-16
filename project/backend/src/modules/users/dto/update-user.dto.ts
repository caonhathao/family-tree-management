import { IsDate, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class UserUpdateDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: false,
  })
  @IsString()
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL_INCORRECT })
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: 'newPassword123',
    required: false,
  })
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsDate()
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'User biography',
    example: 'A brief description about the user',
    required: false,
  })
  @IsString()
  biography?: string;
}
