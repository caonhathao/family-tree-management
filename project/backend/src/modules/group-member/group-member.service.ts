import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    return await this.prisma.groupMember.updateMany({
      where: {
        groupId: groupId,
        memberId: userId,
      },
      data: {
        role: data.role,
      },
    });
  }

  async changeLeader(
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) {
    //check authorization
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }
    //check if new leader is exist in group
    const newLeader = await this.prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        memberId: data.id,
      },
    });
    if (!newLeader) {
      throw new ConflictException(Exception.NOT_EXIST);
    }
    //check if requester is leader
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        memberId: userId,
      },
      select: {
        memberId: true,
        isLeader: true,
      },
    });

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
        const newLeader = await tx.groupMember.updateMany({
          where: {
            groupId: groupId,
            memberId: data.id,
          },
          data: {
            isLeader: true,
            role: USER_ROLE.OWNER,
          },
        });
        return newLeader;
      });
    }
    throw new UnauthorizedException(Exception.PEMRISSION);
  }
}
