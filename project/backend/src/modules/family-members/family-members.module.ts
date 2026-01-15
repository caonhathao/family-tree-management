import { Module } from '@nestjs/common';
import { MemberController } from './family-members.controller';
import { MemberService } from './family-members.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
