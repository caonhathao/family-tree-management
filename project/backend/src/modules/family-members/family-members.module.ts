import { Module } from '@nestjs/common';
import { MemberController } from './family-members.controller';
import { MemberService } from './family-members.service';
import { CloudinaryModule } from 'src/common/config/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
