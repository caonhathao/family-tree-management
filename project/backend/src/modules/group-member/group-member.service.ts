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

@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async updaterRole(
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) {
    //check if member is in the same groupconst [requester, targetMember] = await Promise.all([
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
  }
  async changeLeader(
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) {
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
    const [requester, member] = await Promise.all([
      //check if requester is leader
      this.prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: userId,
        },
        select: {
          memberId: true,
          role: true,
          isLeader: true,
        },
      }),

      //check if member to remove is not exist in group
      this.prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: memberId,
        },
      }),
    ]);

    if (!requester) {
      throw new ConflictException(Exception.NOT_EXIST);
    }
    if (!requester.isLeader) {
      throw new UnauthorizedException(Exception.PEMRISSION);
    }
    if (!member) {
      throw new ConflictException(Exception.NOT_EXIST);
    }

    return await this.prisma.groupMember.deleteMany({
      where: {
        groupId: groupId,
        memberId: memberId,
      },
    });
  }
}
