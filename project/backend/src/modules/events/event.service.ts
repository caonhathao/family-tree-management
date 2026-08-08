import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { addDays, startOfDay } from 'date-fns';
import {
  EVENT_INSTANCE_STATUS,
  EVENT_TYPE,
  MEMBER_ROLE,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Exception } from 'src/common/messages/messages.response';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { RecurrenceRule, RecurrenceService } from './recurrence.service';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrenceService: RecurrenceService,
  ) {}

  async create(userId: string, dto: CreateEventDto) {
    const membership = await this.getMembershipOrThrow(userId, dto.groupId);
    this.assertCanManage(membership.role);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.validateTimes(startTime, endTime);

    if (dto.isRecurring && !dto.recurrence) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }
    const rule = dto.isRecurring ? this.buildRule(dto.recurrence!) : null;

    const now = new Date();
    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          groupId: dto.groupId,
          title: dto.title,
          description: dto.description,
          type: dto.type ?? EVENT_TYPE.OTHER,
          startTime,
          endTime,
          isRecurring: dto.isRecurring ?? false,
          createBy: userId,
          recurrence: rule
            ? {
                create: {
                  freq: rule.freq,
                  interval: rule.interval,
                  endsAt: rule.endsAt,
                  count: rule.count,
                },
              }
            : undefined,
        },
      });

      const instanceRows = this.buildInstanceRows(
        created.id,
        startTime,
        endTime,
        rule,
        now,
      );
      if (instanceRows.length) {
        await tx.eventInstance.createMany({
          data: instanceRows,
          skipDuplicates: true,
        });
      }

      return created;
    });

    return this.getById(userId, event.id);
  }

  async findAll(userId: string, query: QueryEventsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const groupId = query.groupId;
    if (groupId) {
      await this.getMembershipOrThrow(userId, groupId);
    }

    const from = query.from ? new Date(query.from) : startOfDay(new Date());
    const to = query.to ? new Date(query.to) : addDays(new Date(), 30);
    if (to.getTime() < from.getTime()) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }

    const where: Prisma.EventWhereInput = {
      ...(groupId
        ? { groupId }
        : { group: { groupMembers: { some: { memberId: userId } } } }),
      instances: {
        some: { startTime: { gte: from, lte: to } },
      },
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: {
          recurrence: true,
          instances: {
            where: { startTime: { gte: from, lte: to } },
            orderBy: { startTime: 'asc' },
            take: 100,
          },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, page, limit, total };
  }

  async getById(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        recurrence: true,
        instances: { orderBy: { startTime: 'asc' }, take: 100 },
        group: { select: { id: true, name: true } },
      },
    });
    if (!event) throw new NotFoundException(Exception.NOT_EXIST);

    await this.getMembershipOrThrow(userId, event.groupId);
    return event;
  }

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { recurrence: true },
    });
    if (!existing) throw new NotFoundException(Exception.NOT_EXIST);

    const membership = await this.getMembershipOrThrow(
      userId,
      existing.groupId,
    );
    this.assertCanManage(membership.role);

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;
    this.validateTimes(startTime, endTime);

    const isRecurring = dto.isRecurring ?? existing.isRecurring;
    const rule = dto.recurrence
      ? this.buildRule(dto.recurrence)
      : isRecurring
        ? existing.recurrence
          ? {
              freq: existing.recurrence.freq,
              interval: existing.recurrence.interval,
              endsAt: existing.recurrence.endsAt ?? undefined,
              count: existing.recurrence.count ?? undefined,
            }
          : null
        : null;
    if (isRecurring && !rule) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.type !== undefined && { type: dto.type }),
          startTime,
          endTime,
          isRecurring,
        },
      });

      if (isRecurring && rule) {
        await tx.eventRecurrence.upsert({
          where: { eventId },
          create: {
            eventId,
            freq: rule.freq,
            interval: rule.interval,
            endsAt: rule.endsAt,
            count: rule.count,
          },
          update: {
            freq: rule.freq,
            interval: rule.interval,
            endsAt: rule.endsAt,
            count: rule.count,
          },
        });
      } else {
        await tx.eventRecurrence.deleteMany({ where: { eventId } });
      }

      // Regenerate future instances from the original series anchor.
      await tx.eventInstance.deleteMany({
        where: { eventId, startTime: { gte: now } },
      });

      await tx.eventInstance.createMany({
        data: this.buildInstanceRows(
          eventId,
          startTime,
          endTime,
          isRecurring ? rule : null,
          now,
          existing.startTime,
          existing.endTime,
        ),
        skipDuplicates: true,
      });
    });

    return this.getById(userId, eventId);
  }

  async remove(userId: string, eventId: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { groupId: true },
    });
    if (!existing) throw new NotFoundException(Exception.NOT_EXIST);

    const membership = await this.getMembershipOrThrow(
      userId,
      existing.groupId,
    );
    this.assertCanManage(membership.role);

    await this.prisma.event.delete({ where: { id: eventId } });
  }

  async listInstances(userId: string, eventId: string, query: QueryEventsDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { groupId: true },
    });
    if (!existing) throw new NotFoundException(Exception.NOT_EXIST);
    await this.getMembershipOrThrow(userId, existing.groupId);

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && to.getTime() < from.getTime()) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }

    const instances = await this.prisma.eventInstance.findMany({
      where: {
        eventId,
        ...(from && { startTime: { gte: from } }),
        ...(to && { startTime: { lte: to } }),
      },
      orderBy: { startTime: 'asc' },
      take: 200,
    });

    return instances;
  }

  async cancelInstance(userId: string, eventId: string, instanceId: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { groupId: true },
    });
    if (!existing) throw new NotFoundException(Exception.NOT_EXIST);

    const membership = await this.getMembershipOrThrow(
      userId,
      existing.groupId,
    );
    this.assertCanManage(membership.role);

    const instance = await this.prisma.eventInstance.findFirst({
      where: { id: instanceId, eventId },
    });
    if (!instance) throw new NotFoundException(Exception.NOT_EXIST);
    if (
      instance.status === EVENT_INSTANCE_STATUS.COMPLETED ||
      instance.status === EVENT_INSTANCE_STATUS.CANCELLED
    ) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }

    return this.prisma.eventInstance.update({
      where: { id: instanceId },
      data: { status: EVENT_INSTANCE_STATUS.CANCELLED },
    });
  }

  private async getMembershipOrThrow(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: { memberId: userId, groupId },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException(Exception.NOT_EXIST);
    return membership;
  }

  private assertCanManage(role: MEMBER_ROLE) {
    if (role !== MEMBER_ROLE.OWNER && role !== MEMBER_ROLE.EDITOR) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }
  }

  private validateTimes(startTime: Date, endTime: Date) {
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }
  }

  private buildRule(
    rec: NonNullable<CreateEventDto['recurrence']>,
  ): RecurrenceRule {
    if (rec.endsAt && rec.count) {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }
    return {
      freq: rec.freq,
      interval: rec.interval ?? 1,
      endsAt: rec.endsAt ? new Date(rec.endsAt) : undefined,
      count: rec.count,
    };
  }

  private buildInstanceRows(
    eventId: string,
    startTime: Date,
    endTime: Date,
    rule: RecurrenceRule | null,
    now: Date,
    anchorStart: Date = startTime,
    anchorEnd: Date = endTime,
  ) {
    const rows: Prisma.EventInstanceCreateManyInput[] = [
      {
        eventId,
        startTime,
        endTime,
        status: this.statusFor(startTime, endTime, now),
      },
    ];

    if (rule) {
      const future = this.recurrenceService.expand(
        rule,
        anchorStart,
        anchorEnd,
        { from: now },
      );
      for (const slot of future) {
        rows.push({
          eventId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: EVENT_INSTANCE_STATUS.SCHEDULED,
        });
      }
    }

    return rows;
  }

  private statusFor(startTime: Date, endTime: Date, now: Date) {
    if (now.getTime() < startTime.getTime()) {
      return EVENT_INSTANCE_STATUS.SCHEDULED;
    }
    if (now.getTime() < endTime.getTime()) {
      return EVENT_INSTANCE_STATUS.ONGOING;
    }
    return EVENT_INSTANCE_STATUS.COMPLETED;
  }
}
