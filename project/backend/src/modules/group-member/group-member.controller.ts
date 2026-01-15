import { Body, Controller, Param, Patch } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';

@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Patch(':id')
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
