import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Exception } from 'src/common/messages/messages.response';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateGroupFamilyDto } from './dto/update-group-family.dto';
import { CreateGroupFamilyDto } from './dto/create-group-family.dto';
import { USER_ROLE } from '@prisma/client';

@Injectable()
export class GroupFamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: CreateGroupFamilyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORISEZD);
    }

    const newGroup = await this.prisma.groupFamily.create({
      data: {
        ...data,
        userId: userId,
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
      throw new UnauthorizedException(Exception.UNAUTHORISEZD);
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
    });

    return updatedGroup;
  }

  async getOne(userId: string, groupId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORISEZD);
    }

    const group = await this.prisma.groupFamily.findFirst({
      where: { id: groupId, userId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        familyId: true,
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
      throw new UnauthorizedException(Exception.UNAUTHORISEZD);
    }

    const groups = await this.prisma.groupFamily.findMany({
      where: { userId: userId },
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
      throw new UnauthorizedException(Exception.UNAUTHORISEZD);
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
}
