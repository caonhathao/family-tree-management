import { USER_ROLE } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsEnum(USER_ROLE)
  role: USER_ROLE;

  userProfile: UserProfileDto[];
}

export class UserProfileDto {
  @IsString()
  fullName: string;

  avatar: string | null;
}
