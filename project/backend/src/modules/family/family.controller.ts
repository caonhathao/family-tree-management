import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyDto } from './dto/create-family.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { USER_ROLE } from '@prisma/client';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AtGuard } from '../auth/guards/auth.guard';
import { FamilyUpdateDto } from './dto/update-family.dto';

@Controller('family')
@UseGuards(AtGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async createFamily(
    @GetCurrentUserId() userId: string,
    @Body() familyDto: FamilyDto,
  ) {
    const family = await this.familyService.create(userId, familyDto);
    return ResponseFactory.success({
      data: family,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Patch()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async updateFamily(@Body() familyUpdate: FamilyUpdateDto) {
    const family = await this.familyService.update(familyUpdate);
    return ResponseFactory.success({
      data: family,
      message: ValidMessageResponse.UPDATED,
    });
  }
}
