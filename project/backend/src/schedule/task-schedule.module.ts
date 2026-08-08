import { Module } from '@nestjs/common';
import { TasksService } from './task-schedule.service';
import { EventSchedulerService } from './event-scheduler.service';
import { EventsModule } from '../modules/events/events.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [EventsModule, NotificationsModule],
  providers: [TasksService, EventSchedulerService],
})
export class TaskModule {}
