import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupMemberService } from './group-member.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { IsLeader } from 'src/common/decorators/leader.decorator';

@ApiTags('group-member')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update group member role' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group member role updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Group or member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @IsLeader()
  async updateGroupMemberRole(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Body() data: UpdateGroupMemberDto,
  ) {
    const result = await this.groupMemberService.updaterRole(
      userId,
      groupId,
      data,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Patch('leader/:id')
  @ApiOperation({ summary: 'Change group leader' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group leader changed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only current leader can change leader',
  })
  @ApiResponse({ status: 404, description: 'Group or member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @IsLeader()
  async changeGroupMemberLeader(
    @GetCurrentUserId() userId: string,
    @Param('id') groupId: string,
    @Body() data: UpdateGroupMemberDto,
  ) {
    const result = await this.groupMemberService.changeLeader(
      userId,
      groupId,
      data,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Delete(':groupId/:memberId')
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Group or member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @IsLeader()
  async removeMember(
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    const result = await this.groupMemberService.removeMember(
      userId,
      groupId,
      memberId,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.DELETED,
    });
  }
}
