import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Exception } from 'src/common/messages/messages.response';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateGroupFamilyDto } from './dto/update-group-family.dto';
import { CreateGroupFamilyDto } from './dto/create-group-family.dto';
import { EVENT_INSTANCE_STATUS, MEMBER_ROLE } from '@prisma/client';
import { isUUID } from 'class-validator';
import { endOfDay, startOfDay } from 'date-fns';
import {
  DeletedGroupData,
  GroupData,
  GroupDetail,
  GroupListEntry,
  JoinGroupData,
  QuitGroupData,
} from './types/group-family-response.type';

@Injectable()
export class GroupFamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: CreateGroupFamilyDto): Promise<GroupData> {
    //console.log(data);
    try {
      const newGroup = await this.prisma.groupFamily.create({
        data: {
          name: data.name,
          description: data.description,
        },
        select: { id: true, name: true, description: true },
      });
      // Add creator as owner and leader of the new group
      await this.prisma.groupMember.create({
        data: {
          groupId: newGroup.id,
          memberId: userId,
          role: data.role || MEMBER_ROLE.OWNER,
          isLeader: true,
        },
      });
      //console.log('new member at create group family service: ', newMember);
      return newGroup;
    } catch (err) {
      console.log('err at create group family service:', err);
      throw err;
    }
  }
  async update(
    userId: string,
    groupId: string,
    data: UpdateGroupFamilyDto,
  ): Promise<GroupData> {
    if (!isUUID(groupId, 'all')) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        memberId: userId,
        groupId: groupId,
      },
      select: {
        isLeader: true,
      },
    });

    if (!groupMember || !groupMember.isLeader) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    if (data.name === '') throw new BadRequestException(Exception.BAD_REQUEST);

    const updatedGroup = await this.prisma.groupFamily.update({
      where: { id: groupId },
      data: {
        ...data,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return updatedGroup;
  }
  async getOne(userId: string, groupId: string): Promise<GroupDetail> {
    if (!isUUID(groupId, 'all')) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }
    //check group exist
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
        groupMembers: {
          some: { memberId: userId },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        family: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        groupMembers: {
          select: {
            member: {
              select: {
                userProfile: {
                  select: {
                    id: true,
                    userId: true,
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
            role: true,
            isLeader: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);
    return group;
  }
  async getAll(userId: string): Promise<GroupListEntry[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    const groups = await this.prisma.groupFamily.findMany({
      where: { groupMembers: { some: { memberId: userId } } },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const membershipWhere = {
      group: { groupMembers: { some: { memberId: userId } } },
    };

    const [eventGroups, todayEventGroups] = await Promise.all([
      this.prisma.event.groupBy({
        by: ['groupId'],
        where: membershipWhere,
        _count: { _all: true },
      }),
      this.prisma.eventInstance.findMany({
        where: {
          startTime: { lte: endOfDay(new Date()) },
          endTime: { gte: startOfDay(new Date()) },
          status: {
            notIn: [
              EVENT_INSTANCE_STATUS.CANCELLED,
              EVENT_INSTANCE_STATUS.SKIPPED,
            ],
          },
          event: membershipWhere,
        },
        select: { event: { select: { groupId: true } } },
        distinct: ['eventId'],
        orderBy: { eventId: 'asc' },
      }),
    ]);

    const eventGroupIds = new Set(eventGroups.map((row) => row.groupId));
    const todayEventGroupIds = new Set(
      todayEventGroups.map((row) => row.event.groupId),
    );

    return groups.map((group) => ({
      ...group,
      in_event: eventGroupIds.has(group.id),
      hasEventToday: todayEventGroupIds.has(group.id),
    }));
  }
  async delete(userId: string, groupId: string): Promise<DeletedGroupData> {
    try {
      const groupMember = await this.prisma.groupMember.findFirst({
        where: {
          memberId: userId,
          groupId: groupId,
        },
        select: {
          isLeader: true,
        },
      });

      if (!groupMember) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

      if (!groupMember.isLeader) {
        throw new ForbiddenException(Exception.PEMRISSION);
      }
      //check group family exist
      const groupFamily = await this.prisma.groupFamily.findFirst({
        where: {
          id: groupId,
        },
      });

      if (!groupFamily) throw new NotFoundException(Exception.NOT_EXIST);

      return await this.prisma.groupFamily.delete({
        where: { id: groupId },
      });
    } catch (err) {
      console.log('failed at delete of group-family service: ', err);
      throw err;
    }
  }
  async quitGroup(userId: string, groupId: string): Promise<QuitGroupData> {
    try {
      if (!isUUID(groupId, 'all')) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

      const member = await this.prisma.groupMember.findFirst({
        where: {
          memberId: userId,
          groupId: groupId,
        },
        select: {
          id: true,
          role: true,
          isLeader: true,
        },
      });

      if (!member) throw new NotFoundException(Exception.NOT_EXIST);

      if (member.isLeader) throw new ForbiddenException(Exception.PEMRISSION);
      if (member.role !== MEMBER_ROLE.VIEWER)
        throw new ForbiddenException(Exception.PEMRISSION);

      return await this.prisma.groupMember.delete({
        where: {
          memberId_groupId: {
            memberId: userId,
            groupId: groupId,
          },
        },
        select: {
          id: true,
          memberId: true,
        },
      });
    } catch (err) {
      console.log('failed at quitGroup of group-family service: ', err);
      throw err;
    }
  }

  async joinGroup(token: string, getterId: string): Promise<JoinGroupData> {
    //check token valid
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      select: {
        groupId: true,
        expiresAt: true,
      },
    });
    if (!invite) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    if (new Date() > invite.expiresAt) {
      throw new ForbiddenException(Exception.EXPIRED);
    }

    //check user (getter) authorization
    const getter = await this.prisma.user.findFirst({
      where: { id: getterId },
      select: {
        id: true,
      },
    });
    if (!getter) {
      throw new NotFoundException(Exception.UNAUTHORIZED);
    }
    //check if getter is already in the group
    const existedGetter = await this.prisma.groupMember.findFirst({
      where: {
        memberId: getterId,
        groupId: invite.groupId,
      },
      select: {
        id: true,
      },
    });

    if (existedGetter) {
      const member = await this.prisma.groupMember.findFirst({
        where: {
          memberId: getterId,
          groupId: invite.groupId,
        },
        select: {
          id: true,
          groupId: true,
          memberId: true,
          role: true,
          isLeader: true,
        },
      });
      if (!member) throw new NotFoundException(Exception.NOT_EXIST);
      return member;
    }

    //check group exist
    const group = await this.prisma.groupFamily.findUnique({
      where: {
        id: invite.groupId,
      },
      select: {
        id: true,
      },
    });

    if (!group) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    const newMember = await this.prisma.groupMember.create({
      data: {
        groupId: invite.groupId,
        memberId: getterId,
        role: MEMBER_ROLE.VIEWER,
        isLeader: false,
      },
      select: {
        id: true,
        groupId: true,
        memberId: true,
        role: true,
        isLeader: true,
      },
    });
    if (!newMember) throw new ForbiddenException(Exception.CREATED);
    return newMember;
  }
}
