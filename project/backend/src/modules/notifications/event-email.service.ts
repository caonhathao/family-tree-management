import { Injectable, Logger } from '@nestjs/common';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import { createElement } from 'react';
import {
  EMAIL_KIND,
  EMAIL_STATUS,
  EVENT_INSTANCE_STATUS,
  EVENT_TYPE,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResendService } from 'src/common/config/resend/resend.service';
import { EnvConfigService } from 'src/common/config/env/env-config.service';

const EVENT_TYPE_LABEL: Record<EVENT_TYPE, string> = {
  DEATH_ANNIVERSARY: 'Giỗ',
  BIRTHDAY: 'Sinh nhật',
  WEDDING: 'Kỷ niệm cưới',
  OTHER: 'Khác',
};

interface SendRangeOptions {
  kind: EMAIL_KIND;
  from: Date;
  to: Date;
  reminder: boolean;
}

@Injectable()
export class EventEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
    private readonly envConfig: EnvConfigService,
  ) {}

  private readonly logger = new Logger(EventEmailService.name);

  async sendTodayEmails() {
    const now = new Date();
    await this.sendForRange({
      kind: EMAIL_KIND.TODAY,
      from: startOfDay(now),
      to: endOfDay(now),
      reminder: false,
    });
  }

  async sendReminderEmails() {
    const tomorrow = addDays(new Date(), 1);
    await this.sendForRange({
      kind: EMAIL_KIND.REMINDER,
      from: startOfDay(tomorrow),
      to: endOfDay(tomorrow),
      reminder: true,
    });
  }

  private async sendForRange(options: SendRangeOptions) {
    if (!this.resendService.enabled) {
      this.logger.debug('Resend chưa được cấu hình, bỏ qua gửi email.');
      return;
    }

    const instances = await this.prisma.eventInstance.findMany({
      where: {
        startTime: { gte: options.from, lte: options.to },
        status: {
          in: [EVENT_INSTANCE_STATUS.SCHEDULED, EVENT_INSTANCE_STATUS.ONGOING],
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    for (const instance of instances) {
      const event = instance.event;

      const [members, sentLogs] = await Promise.all([
        this.prisma.groupMember.findMany({
          where: { groupId: event.group.id },
          select: { member: { select: { id: true, email: true } } },
        }),
        this.prisma.emailLog.findMany({
          where: { eventInstanceId: instance.id, kind: options.kind },
          select: { userId: true },
        }),
      ]);

      const sentUserIds = new Set(sentLogs.map((log) => log.userId));
      const recipients = members
        .map((membership) => membership.member)
        .filter((member) => member.email && !sentUserIds.has(member.id));

      for (const recipient of recipients) {
        await this.sendAndLog(instance, event, recipient, options);
      }
    }
  }

  private async sendAndLog(
    instance: {
      id: string;
      startTime: Date;
      endTime: Date;
    },
    event: {
      id: string;
      title: string;
      type: EVENT_TYPE;
      group: { id: string; name: string };
    },
    recipient: { id: string; email: string },
    options: SendRangeOptions,
  ) {
    const subject = options.reminder
      ? `Ngày mai: ${event.title}`
      : `Hôm nay: ${event.title}`;

    let html: string;
    try {
      // Lazy-load react-email để không nằm trong dependency graph khi boot
      const { render } = (await import('react-email')) as {
        render: (element: ReturnType<typeof createElement>) => Promise<string>;
      };
      const { EventNotificationEmail } =
        await import('./templates/event-notification.email.js');
      html = await render(
        createElement(EventNotificationEmail, {
          eventTitle: event.title,
          eventType: EVENT_TYPE_LABEL[event.type] ?? event.type,
          startTime: format(
            new Date(instance.startTime),
            "dd/MM/yyyy 'lúc' HH:mm",
          ),
          endTime: format(new Date(instance.endTime), 'HH:mm'),
          groupName: event.group.name,
          link: `${this.envConfig.clientDomain}/group?groupId=${event.group.id}`,
          reminder: options.reminder,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Không render được email cho instance ${instance.id}: ${(error as Error).message}`,
      );
      return;
    }

    let status: EMAIL_STATUS = EMAIL_STATUS.SENT;
    let error: string | null = null;
    let sentAt: Date | null = new Date();

    try {
      await this.resendService.sendEmail({
        to: recipient.email,
        subject,
        html,
      });
    } catch (err) {
      status = EMAIL_STATUS.FAILED;
      error = (err as Error).message ?? 'Unknown error';
      sentAt = null;
    }

    await this.prisma.emailLog.create({
      data: {
        userId: recipient.id,
        eventId: event.id,
        eventInstanceId: instance.id,
        kind: options.kind,
        to: recipient.email,
        subject,
        status,
        error,
        sentAt,
      },
    });

    if (status === EMAIL_STATUS.SENT) {
      this.logger.debug(
        `Đã gửi email ${options.kind} cho ${recipient.email} (instance ${instance.id})`,
      );
    }
  }
}
