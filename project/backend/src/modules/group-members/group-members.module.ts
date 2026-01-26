import { Module } from '@nestjs/common';
import { GroupMemberController } from './group-members.controller';
import { GroupMemberService } from './group-members.service';

@Module({
  controllers: [GroupMemberController],
  providers: [GroupMemberService],
})
export class GroupMemberModule {}
