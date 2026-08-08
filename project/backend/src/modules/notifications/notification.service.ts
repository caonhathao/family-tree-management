import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Exception } from 'src/common/messages/messages.response';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.GroupNotificationWhereInput = {
      userId,
      ...(query.groupId && { groupId: query.groupId }),
      ...(query.unread !== undefined && { isRead: !query.unread }),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.groupNotification.count({ where }),
      this.prisma.groupNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: { select: { id: true, name: true } },
          event: { select: { id: true, title: true } },
        },
      }),
    ]);

    return { data, page, limit, total };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.groupNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException(Exception.NOT_EXIST);

    return this.prisma.groupNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string, query: QueryNotificationsDto) {
    const result = await this.prisma.groupNotification.updateMany({
      where: {
        userId,
        isRead: false,
        ...(query.groupId && { groupId: query.groupId }),
      },
      data: { isRead: true },
    });
    return result.count;
  }
}
