import {
  Body,
  Controller,
  Patch,
  Post,
  Get,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('family')
@ApiBearerAuth()
@Controller('family')
@UseGuards(AtGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post(':groupId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Create a new family' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 201, description: 'Family created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @Patch(':groupId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Update a family' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Family updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateFamily(
    @GetCurrentUserId() userId: string,
    @Body() familyUpdate: FamilyUpdateDto,
  ) {
    const family = await this.familyService.update(familyUpdate, userId);
    return ResponseFactory.success({
      data: family,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a family by ID' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ status: 200, description: 'Family retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') familyId: string,
  ) {
    const family = await this.familyService.get(familyId, userId);
    return ResponseFactory.success({
      data: family,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Delete(':id/:groupId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Delete a family' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Family deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Family not found' })
  async deleteFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') familyId: string,
  ) {
    await this.familyService.delete(familyId, userId);
    return ResponseFactory.success({
      message: ValidMessageResponse.DELETED,
    });
  }
}
