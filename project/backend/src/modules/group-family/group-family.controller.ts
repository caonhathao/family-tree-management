import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GroupFamilyService } from './group-family.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { UpdateGroupFamilyDto } from './dto/update-group-family.dto';
import { CreateGroupFamilyDto } from './dto/create-group-family.dto';

@ApiTags('group-family')
@ApiBearerAuth()
@Controller('group-family')
export class GroupFamilyController {
  constructor(private readonly groupFamilyService: GroupFamilyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group family' })
  @ApiResponse({
    status: 201,
    description: 'Group family created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update a group family' })
  @ApiParam({ name: 'id', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Group family updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get a group family by ID' })
  @ApiParam({ name: 'id', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Group family retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Group family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get all group families for current user' })
  @ApiResponse({
    status: 200,
    description: 'Group families retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllGroupFamilies(@GetCurrentUserId() userId: string) {
    const groupFamilies = await this.groupFamilyService.getAll(userId);
    return ResponseFactory.success({
      data: groupFamilies,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a group family using invitation token' })
  @ApiQuery({
    name: 'token',
    description: 'Invitation token to join group family',
    example: 'abc123token',
  })
  @ApiResponse({ status: 200, description: 'Successfully joined group family' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 409, description: 'Already a member of this group' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
