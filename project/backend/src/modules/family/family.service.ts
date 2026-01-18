import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FamilyDto } from './dto/create-family.dto';
import { FamilyUpdateDto } from './dto/update-family.dto';
import { Exception } from 'src/common/messages/messages.response';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, groupId: string, data: FamilyDto) {
    //check user authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    //check group exist
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);

    const newFamily = await this.prisma.family.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        owner: {
          select: {
            id: true,
            userProfile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    //update group with new family
    await this.prisma.groupFamily.update({
      where: {
        id: groupId,
      },
      data: {
        familyId: newFamily.id,
      },
    });

    return {
      family: {
        id: newFamily.id,
        name: newFamily.name,
        description: newFamily.description,
      },
      owner: {
        id: newFamily.owner.id,
        name: newFamily.owner.userProfile?.fullName,
        avatar: newFamily.owner.userProfile?.avatar,
      },
    };
  }
  async update(data: FamilyUpdateDto, userId: string, groupId: string) {
    //check user authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    //check family exist
    const family = await this.prisma.family.findFirst({
      where: {
        id: data.id,
      },
    });
    if (!family) throw new NotFoundException(Exception.NOT_EXIST);

    //check group exist
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);

    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.family.update({
      where: { id: data.id, ownerId: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        owner: {
          select: {
            id: true,
            userProfile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }
  async get(familyId: string, userId: string) {
    //check user authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: {
        familyId: familyId,
        groupMembers: {
          some: { memberId: userId },
        },
      },
    });

    if (!groupFamily) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    return await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        id: true,
        name: true,
        description: true,
        owner: {
          select: {
            id: true,
            userProfile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            familyMembers: true,
            albums: true,
            events: true,
            activityLogs: true,
          },
        },
      },
    });
  }
  async delete(groupId: string, familyId: string, userId: string) {
    //check user authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
        familyId: familyId,
        groupMembers: {
          some: { memberId: userId },
        },
      },
      select: {
        id: true,
        groupMembers: {
          where: { memberId: userId },
          select: {
            isLeader: true,
          },
        },
      },
    });

    if (!groupFamily) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    if (groupFamily.groupMembers[0].isLeader === false) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }
    return await this.prisma.family.delete({
      where: { id: familyId, ownerId: userId },
    });
  }
}
