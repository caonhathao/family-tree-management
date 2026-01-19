import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Exception } from 'src/common/messages/messages.response';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateGroupFamilyDto } from './dto/update-group-family.dto';
import { CreateGroupFamilyDto } from './dto/create-group-family.dto';
import { USER_ROLE } from '@prisma/client';

@Injectable()
export class GroupFamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: CreateGroupFamilyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    const newGroup = await this.prisma.groupFamily.create({
      data: {
        ...data,
      },
      select: { id: true, name: true, description: true },
    });
    // Add creator as owner and leader of the new group
    await this.prisma.groupMember.create({
      data: {
        groupId: newGroup.id,
        memberId: userId,
        role: data.role || USER_ROLE.OWNER,
        isLeader: true,
      },
    });
    return newGroup;
  }
  async update(userId: string, groupId: string, data: UpdateGroupFamilyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
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

    if (!groupMember) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    if (!groupMember.isLeader) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

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
  async getOne(userId: string, groupId: string) {
    //check user authorization
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

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
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    return group;
  }
  async getAll(userId: string) {
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
    return groups;
  }
  async delete(userId: string, groupId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
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

    if (!groupMember) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    if (!groupMember.isLeader) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    return await this.prisma.groupFamily.delete({
      where: { id: groupId },
    });
  }
  async joinGroup(token: string, getterId: string) {
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
      throw new ForbiddenException(Exception.EXISTED);
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
        role: USER_ROLE.VIEWER,
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
    return newMember;
  }
}
