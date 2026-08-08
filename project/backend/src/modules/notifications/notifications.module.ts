import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EventNotificationService } from './event-notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EventNotificationService],
  exports: [EventNotificationService],
})
export class NotificationsModule {}
