import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { Exception } from 'src/common/messages/messages.response';
import { USER_ROLE } from '@prisma/client';
import { isUUID } from 'class-validator';

@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async updaterRole(
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) {
    console.log('updaterRole called with:', { userId, groupId, data });
    //check if member is in the same groupconst [requester, targetMember] = await Promise.all([
    try {
      const [requester, targetMember] = await Promise.all([
        this.prisma.groupMember.findFirst({
          where: { groupId, memberId: userId },
        }),
        this.prisma.groupMember.findFirst({
          where: { groupId, memberId: data.id },
        }),
      ]);

      if (!targetMember) throw new NotFoundException(Exception.NOT_EXIST);

      if (!requester) throw new ForbiddenException(Exception.PEMRISSION);

      return await this.prisma.groupMember.update({
        where: {
          memberId_groupId: {
            groupId: groupId,
            memberId: data.id,
          },
        },
        data: {
          role: data.role,
        },
        select: {
          id: true,
          memberId: true,
          groupId: true,
          role: true,
          isLeader: true,
        },
      });
    } catch (err) {
      console.log('group member service failed: ', err);
      throw err;
    }
  }
  async changeLeader(
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) {
    console.log('changeLeader called with:', { userId, groupId, data });
    if (!isUUID(groupId)) throw new ForbiddenException(Exception.ID_MISSING);
    if (!isUUID(data.id)) throw new ForbiddenException(Exception.ID_MISSING);
    const [newLeader, groupMember] = await Promise.all([
      //check if new leader is exist in group
      this.prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: data.id,
        },
      }),
      //check if requester is leader
      this.prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: userId,
        },
        select: {
          memberId: true,
          isLeader: true,
        },
      }),
    ]);
    if (!newLeader) {
      throw new ConflictException(Exception.NOT_EXIST);
    }
    if (!groupMember) {
      throw new ConflictException(Exception.NOT_EXIST);
    }

    if (groupMember.isLeader) {
      return await this.prisma.$transaction(async (tx) => {
        //delete old leader
        await tx.groupMember.updateMany({
          where: {
            groupId: groupId,
            memberId: userId,
          },
          data: {
            isLeader: false,
            role: USER_ROLE.VIEWER,
          },
        });
        const newLeader = await tx.groupMember.update({
          where: {
            memberId_groupId: {
              groupId: groupId,
              memberId: data.id,
            },
          },
          data: {
            isLeader: true,
            role: USER_ROLE.OWNER,
          },
          select: {
            id: true,
            memberId: true,
            groupId: true,
            role: true,
            isLeader: true,
          },
        });
        return newLeader;
      });
    }
    throw new UnauthorizedException(Exception.PEMRISSION);
  }
  async removeMember(userId: string, groupId: string, memberId: string) {
    console.log('groupId:', groupId);
    console.log('memberId:', memberId);
    try {
      if (!isUUID(groupId, 'all'))
        throw new NotFoundException(Exception.NOT_EXIST);
      if (!isUUID(memberId, 'all'))
        throw new NotFoundException(Exception.NOT_EXIST);

      //check validation: requester (defined by userId) and target (defined by memberId) is in the same group
      const members = await this.prisma.groupMember.findMany({
        where: {
          groupId: groupId,
          memberId: { in: [userId, memberId] },
        },
      });

      if (!members) throw new NotFoundException(Exception.NOT_EXIST);

      return await this.prisma.groupMember.deleteMany({
        where: {
          groupId: groupId,
          memberId: memberId,
        },
      });
    } catch (err) {
      console.log('remove member service', err);
      throw err;
    }
  }
}
