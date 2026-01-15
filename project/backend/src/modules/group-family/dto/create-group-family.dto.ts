import { USER_ROLE } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class CreateGroupFamilyDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  role?: USER_ROLE;
}
