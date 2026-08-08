import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays } from 'date-fns';
import { EVENT_INSTANCE_STATUS } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurrenceService } from '../modules/events/recurrence.service';
import { EventNotificationService } from '../modules/notifications/event-notification.service';

const ROLL_FORWARD_DAYS = 365;

@Injectable()
export class EventSchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrenceService: RecurrenceService,
    private readonly eventNotificationService: EventNotificationService,
  ) {}

  private readonly logger = new Logger(EventSchedulerService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEventLifecycle() {
    await this.rollForwardRecurringInstances();
    await this.updateInstanceStatuses();
    await this.eventNotificationService.notifyForTodayInstances();
  }

  async rollForwardRecurringInstances() {
    const events = await this.prisma.event.findMany({
      where: { isRecurring: true },
      include: { recurrence: true },
    });

    for (const event of events) {
      const rule = event.recurrence;
      if (!rule) continue;

      const now = new Date();
      const to = rule.endsAt ?? addDays(now, ROLL_FORWARD_DAYS);

      // Count-bounded series expand the full rule so the total converges to
      // `count` (createMany skipDuplicates trims what already exists).
      // Open-ended series only expand forward from `now` to avoid backfilling
      // the whole history on every run.
      const slots = this.recurrenceService.expand(
        {
          freq: rule.freq,
          interval: rule.interval,
          endsAt: rule.endsAt ?? undefined,
          count: rule.count ?? undefined,
        },
        event.startTime,
        event.endTime,
        rule.count ? { to } : { from: now, to },
      );

      if (!slots.length) continue;

      await this.prisma.eventInstance.createMany({
        data: slots.map((slot) => ({
          eventId: event.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: EVENT_INSTANCE_STATUS.SCHEDULED,
        })),
        skipDuplicates: true,
      });
    }
  }

  async updateInstanceStatuses() {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.eventInstance.updateMany({
        where: {
          status: EVENT_INSTANCE_STATUS.SCHEDULED,
          startTime: { lte: now },
          endTime: { gt: now },
        },
        data: { status: EVENT_INSTANCE_STATUS.ONGOING },
      }),
      this.prisma.eventInstance.updateMany({
        where: {
          status: {
            in: [
              EVENT_INSTANCE_STATUS.SCHEDULED,
              EVENT_INSTANCE_STATUS.ONGOING,
            ],
          },
          endTime: { lte: now },
        },
        data: { status: EVENT_INSTANCE_STATUS.COMPLETED },
      }),
    ]);
  }
}
