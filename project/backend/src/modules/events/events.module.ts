import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { RecurrenceService } from './recurrence.service';

@Module({
  controllers: [EventController],
  providers: [EventService, RecurrenceService],
  exports: [RecurrenceService],
})
export class EventsModule {}
