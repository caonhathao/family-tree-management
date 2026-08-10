import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EventEmailService } from './event-email.service';
import { ResendModule } from 'src/common/config/resend/resend.module';

@Module({
  imports: [ResendModule],
  controllers: [NotificationController],
  providers: [NotificationService, EventEmailService],
  exports: [EventEmailService],
})
export class NotificationsModule {}
