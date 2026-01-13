import { Module } from '@nestjs/common';
import { MemberController } from './members.controller';
import { MemberService } from './members.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
