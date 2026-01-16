import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

export class FamilyDto {
  @ApiProperty({
    description: 'Family name',
    example: 'Johnson Family',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.NAME_EMPTY })
  name: string;

  @ApiProperty({
    description: 'Family description',
    example: 'A loving family of four',
  })
  @IsString()
  @IsNotEmpty({ message: InvalidMessageResponse.DESC_EMPTY })
  description: string;
}
