import { Module } from '@nestjs/common';
import { GroupFamilyController } from './group-family.controller';
import { GroupFamilyService } from './group-family.service';

@Module({
  controllers: [GroupFamilyController],
  providers: [GroupFamilyService],
})
export class GroupFamilyModule {}
