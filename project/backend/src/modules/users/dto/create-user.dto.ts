import { MEMBER_ROLE } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar: string | null;
}

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: MEMBER_ROLE,
    example: 'USER',
  })
  @IsEnum(MEMBER_ROLE)
  role: MEMBER_ROLE;

  @ApiProperty({
    description: 'User profile information',
    type: [UserProfileDto],
  })
  userProfile: UserProfileDto[];
}
