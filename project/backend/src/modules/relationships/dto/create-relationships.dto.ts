import { TYPE_RELATIONSHIP } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

@ValidatorConstraint({ name: 'isNotSelfReferencing', async: false })
export class IsNotSelfReferencingConstraint implements ValidatorConstraintInterface {
  validate(toMemberId: string, args: ValidationArguments) {
    const object = args.object as RelationshipCreateDto;
    return toMemberId !== object.fromMemberId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return `fromMemberId and toMemberId must be different. Self-referencing is not allowed.`;
  }
}

export class RelationshipCreateDto {
  @ApiProperty({
    description: 'Family ID',
    example: 'family123',
  })
  @IsUUID()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  familyId: string;

  @ApiProperty({
    description: 'Source member ID',
    example: 'member123',
  })
  @IsUUID()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  fromMemberId: string;

  @ApiProperty({
    description: 'Target member ID',
    example: 'member456',
  })
  @IsUUID()
  @IsNotEmpty({ message: InvalidMessageResponse.ID_EMPTY })
  @Validate(IsNotSelfReferencingConstraint)
  toMemberId: string;

  @ApiProperty({
    description: 'Type of relationship',
    enum: TYPE_RELATIONSHIP,
    example: 'PARENT',
  })
  @IsEnum(TYPE_RELATIONSHIP)
  @IsNotEmpty({ message: InvalidMessageResponse.FIELD_EMPTY })
  type: TYPE_RELATIONSHIP;
}
