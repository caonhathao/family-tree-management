import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';
import { LINEAGE_TYPE, TYPE_RELATIONSHIP } from '@prisma/client';

export class FamilyDto {
  members: IFamilyMemberDto[];
  relationships: IRelationshipDto[];
  family: IFamilyDto;
}

export class IFamilyMemberDto {
  @ApiProperty({
    description: 'Local ID of family member, created by client',
    required: true,
    example: 'uuidv4()',
  })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  localId: string;

  @ApiProperty({
    description: `Family member's name`,
    example: 'David',
    required: true,
  })
  @MinLength(6, { message: InvalidMessageResponse.NAME_MIN })
  @MaxLength(30, { message: InvalidMessageResponse.NAME_MAX })
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  fullName: string;

  @ApiProperty({
    description: `Family member's gender`,
    example: 'Male',
    required: true,
  })
  @IsString({ message: InvalidMessageResponse.GENDER_INVALID })
  @IsNotEmpty({ message: InvalidMessageResponse.GENDER_EMPTY })
  gender: string;

  @ApiProperty({
    description: `Family member's DOB`,
    required: false,
  })
  @IsOptional()
  @IsDate()
  dateOfBirth?: Date;

  @ApiProperty({
    description: `Family member's DOD`,
    required: false,
  })
  @IsOptional()
  @IsDate()
  dateOfDeath?: Date;

  @ApiProperty({
    description: `Confirm live/death of family member`,
    required: false,
  })
  @IsOptional()
  isAlive?: boolean;

  @ApiProperty({
    description: `Family member's biography`,
    required: false,
  })
  @IsOptional()
  biography?: IBiographyContent;

  @ApiProperty({
    description: `Family member's generation rank`,
    required: false,
  })
  @IsOptional()
  generation: number;

  @ApiProperty({
    description: `Family member's position in flow graph`,
    required: false,
  })
  @IsOptional()
  positionX?: number;

  @ApiProperty({
    description: `Family member's position in flow graph`,
    required: false,
  })
  @IsOptional()
  positionY?: number;
}

export class IRelationshipDto {
  @ApiProperty({
    description: 'Local ID of family member, created by client',
    required: true,
    example: 'uuidv4()',
  })
  @IsString({ message: InvalidMessageResponse.ID_INVAILD })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  localId: string;

  @ApiProperty({
    description: 'ID of family member, created by client',
    required: true,
    example: 'uuidv4()',
  })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  fromMemberId: string;

  @ApiProperty({
    description: 'ID of family member, created by client',
    required: true,
    example: 'uuidv4()',
  })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  toMemberId: string;

  @IsEnum(TYPE_RELATIONSHIP, { message: InvalidMessageResponse.ROLE_EMPTY })
  type: string;
}

export class IFamilyDto {
  @ApiProperty({
    description: 'ID of family, created by client',
    required: true,
    example: 'uuidv4()',
  })
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  @IsUUID('all', { message: InvalidMessageResponse.ID_INVAILD })
  localId: string;
  @ApiProperty({
    description: 'Name of family',
    required: true,
    example: 'Johnson Family',
  })
  @MinLength(6, { message: InvalidMessageResponse.NAME_MIN })
  @MaxLength(30, { message: InvalidMessageResponse.NAME_MAX })
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  name: string;

  @ApiProperty({
    description: 'Description of family',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of family lineage',
    required: true,
  })
  @IsEnum(LINEAGE_TYPE, {
    message: InvalidMessageResponse.LINEAGE_TYPE_INVALID,
  })
  lineageType: string;
}
export type IBiographyContent = {
  education_level: string;
  occupation: string;
  hometown: string;
  achievements: string;
};
