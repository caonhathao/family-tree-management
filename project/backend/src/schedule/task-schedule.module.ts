import { Module } from '@nestjs/common';
import { TasksService } from './task-schedule.service';

@Module({
  providers: [TasksService],
})
export class TaskModule {}
