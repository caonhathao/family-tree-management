import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FamilyDto } from './dto/create-family.dto';
import { FamilyUpdateDto } from './dto/update-family.dto';
import { Exception } from 'src/common/messages/messages.response';
import { isUUID } from 'class-validator';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, groupId: string, data: FamilyDto) {
    //check group exist
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
      },
      select: {
        family: true,
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);
    if (group.family) throw new BadRequestException(Exception.EXISTED);

    //check validation of data
    if (data.name === '' || !data.name)
      throw new BadRequestException(Exception.CREATED);
    if (data.description === '' || !data.description)
      throw new BadRequestException(Exception.CREATED);

    const newFamily = await this.prisma.family.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        groupFamilyId: groupId,
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
    if (!groupId || !isUUID(groupId))
      throw new NotFoundException(Exception.NOT_EXIST);
    if (!data.id || !isUUID(data.id))
      throw new BadRequestException(Exception.ID_MISSING);
    //check if user is a member of group that have family udpated
    const member = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
        family: {
          id: data.id,
        },
        groupMembers: {
          some: {
            memberId: userId,
          },
        },
      },
      select: {
        id: true,
        family: true,
      },
    });

    if (!member) throw new NotFoundException(Exception.NOT_EXIST);

    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.family.update({
      where: { id: data.id },
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
    if (!isUUID(familyId, 'all'))
      throw new NotFoundException(Exception.NOT_EXIST);
    if (!isUUID(userId, 'all'))
      throw new NotFoundException(Exception.NOT_EXIST);

    const family = await this.prisma.family.findUnique({
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
    if (!family) throw new ForbiddenException(Exception.NOT_EXIST);
    return family;
  }
  async delete(groupId: string, familyId: string, userId: string) {
    try {
      //check user
      const groupFamily = await this.prisma.groupFamily.findFirst({
        where: {
          id: groupId,
          groupMembers: {
            some: { memberId: userId },
          },
        },
        select: {
          id: true,
          groupMembers: {
            where: { memberId: userId },
            select: {
              memberId: true,
            },
          },
        },
      });

      if (!groupFamily) {
        throw new ForbiddenException(Exception.PEMRISSION);
      }

      return await this.prisma.family.delete({
        where: { id: familyId, ownerId: groupFamily.groupMembers[0].memberId },
      });
    } catch (err) {
      console.log('family service delete:', err);
      throw err;
    }
  }
}
