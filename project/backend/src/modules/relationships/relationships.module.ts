import { Module } from '@nestjs/common';
import { RelationshipsController } from './relationships.controller';
import { RelationshipService } from './relationships.service';

@Module({
  controllers: [RelationshipsController],
  providers: [RelationshipService],
})
export class RelationshipsModule {}
