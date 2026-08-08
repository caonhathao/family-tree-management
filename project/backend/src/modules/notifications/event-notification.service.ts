import { Injectable, Logger } from '@nestjs/common';
import { endOfDay, startOfDay } from 'date-fns';
import { EVENT_INSTANCE_STATUS, NOTIFICATION_TYPE } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EventNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(EventNotificationService.name);

  /**
   * Notify every group member once per occurrence that happens today.
   * Deduped per (eventInstanceId, userId) by checking existing notifications.
   */
  async notifyForTodayInstances() {
    const now = new Date();
    const instances = await this.prisma.eventInstance.findMany({
      where: {
        startTime: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
        status: {
          in: [EVENT_INSTANCE_STATUS.SCHEDULED, EVENT_INSTANCE_STATUS.ONGOING],
        },
      },
      include: {
        event: { select: { id: true, title: true, groupId: true } },
      },
    });

    for (const instance of instances) {
      const event = instance.event;

      const [existing, members] = await Promise.all([
        this.prisma.groupNotification.findMany({
          where: { eventInstanceId: instance.id },
          select: { userId: true },
        }),
        this.prisma.groupMember.findMany({
          where: { groupId: event.groupId },
          select: { memberId: true },
        }),
      ]);

      const notifiedUserIds = new Set(existing.map((n) => n.userId));
      const toNotify = members
        .map((m) => m.memberId)
        .filter((id) => !notifiedUserIds.has(id));

      if (!toNotify.length) continue;

      await this.prisma.groupNotification.createMany({
        data: toNotify.map((userId) => ({
          userId,
          groupId: event.groupId,
          eventId: event.id,
          eventInstanceId: instance.id,
          title: event.title,
          content: `Event "${event.title}" is happening today`,
          type: NOTIFICATION_TYPE.NEW,
          link: `/group/${event.groupId}`,
        })),
      });

      this.logger.debug(
        `Created ${toNotify.length} notifications for instance ${instance.id}`,
      );
    }
  }
}
