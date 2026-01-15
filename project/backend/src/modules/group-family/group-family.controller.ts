import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GroupFamilyService } from './group-family.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { UpdateGroupFamilyDto } from './dto/update-group-family.dto';
import { CreateGroupFamilyDto } from './dto/create-group-family.dto';

@Controller('group-family')
export class GroupFamilyController {
  constructor(private readonly groupFamilyService: GroupFamilyService) {}

  @Post()
  async createGroupFamily(
    @GetCurrentUserId() userId: string,
    @Body() data: CreateGroupFamilyDto,
  ) {
    const groupFamily = await this.groupFamilyService.create(userId, data);
    return ResponseFactory.success({
      data: groupFamily,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Patch(':id')
  async updateGroupFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Body() data: UpdateGroupFamilyDto,
  ) {
    const groupFamily = await this.groupFamilyService.update(
      userId,
      groupId,
      data,
    );
    return ResponseFactory.success({
      data: groupFamily,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':id')
  async getGroupFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
  ) {
    const groupFamily = await this.groupFamilyService.getOne(userId, groupId);
    return ResponseFactory.success({
      data: groupFamily,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get()
  async getAllGroupFamilies(@GetCurrentUserId() userId: string) {
    const groupFamilies = await this.groupFamilyService.getAll(userId);
    return ResponseFactory.success({
      data: groupFamilies,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('join')
  async joinGroupFamily(
    @GetCurrentUserId() userId: string,
    @Query('token') code: string,
  ) {
    const groupFamily = await this.groupFamilyService.joinGroup(code, userId);
    return ResponseFactory.success({
      data: groupFamily,
      message: ValidMessageResponse.UPDATED,
    });
  }
}
