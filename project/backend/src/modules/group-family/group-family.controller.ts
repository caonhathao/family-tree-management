import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { PinMemberDto } from './dto/pin-member.dto';
import { AtGuard } from '../auth/guards/auth.guard';
import { HttpStatus } from 'src/common/constants/api';
import {
  DeletedGroupResponse,
  GroupDetailResponse,
  GroupListResponse,
  GroupResponse,
  JoinGroupResponse,
  QuitGroupResponse,
} from './types/group-family-response.type';

@ApiTags('group-family')
@ApiBearerAuth()
@Controller('group-family')
export class GroupFamilyController {
  constructor(private readonly groupFamilyService: GroupFamilyService) {}

  @Post()
  @UseGuards(AtGuard)
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
  ): Promise<GroupResponse> {
    // console.log('userId:', userId);
    // console.log('data:', data);
    const groupFamily = await this.groupFamilyService.create(userId, data);
    return ResponseFactory.success({
      data: groupFamily,
      code: HttpStatus.CREATED,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Patch(':id')
  @UseGuards(AtGuard)
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
  ): Promise<GroupResponse> {
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
  @UseGuards(AtGuard)
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
  ): Promise<GroupDetailResponse> {
    const groupFamily = await this.groupFamilyService.getOne(userId, groupId);
    return ResponseFactory.success({
      data: groupFamily,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get()
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Get all group families for current user' })
  @ApiResponse({
    status: 200,
    description: 'Group families retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllGroupFamilies(
    @GetCurrentUserId() userId: string,
  ): Promise<GroupListResponse> {
    const groupFamilies = await this.groupFamilyService.getAll(userId);
    return ResponseFactory.success({
      data: groupFamilies,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Delete(':id')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Destroy a group family (leader only)' })
  @ApiParam({ name: 'id', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Group family deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async destroyGroupFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
  ): Promise<DeletedGroupResponse> {
    const result = await this.groupFamilyService.delete(userId, groupId);
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.DELETED,
    });
  }

  @Delete(':id/quit')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Quit a group family (viewer only)' })
  @ApiParam({ name: 'id', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Quit group family successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async quitGroupFamily(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
  ): Promise<QuitGroupResponse> {
    const result = await this.groupFamilyService.quitGroup(userId, groupId);
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.DELETED,
    });
  }

  @Patch(':id/pin')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Pin a family member to current user in group' })
  @ApiParam({ name: 'id', description: 'Group family ID' })
  @ApiResponse({ status: 200, description: 'Member pinned successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pinMember(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Body() data: PinMemberDto,
  ) {
    const result = await this.groupFamilyService.pinMember(
      userId,
      groupId,
      data.familyMemberId ?? null,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Post('join')
  @UseGuards(AtGuard)
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
  ): Promise<JoinGroupResponse> {
    const groupFamily = await this.groupFamilyService.joinGroup(code, userId);
    return ResponseFactory.success({
      code: HttpStatus.OK,
      data: groupFamily,
      message: ValidMessageResponse.UPDATED,
    });
  }
}
