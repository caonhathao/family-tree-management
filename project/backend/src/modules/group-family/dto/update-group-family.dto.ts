import { IsOptional, IsString } from 'class-validator';

export class UpdateGroupFamilyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
