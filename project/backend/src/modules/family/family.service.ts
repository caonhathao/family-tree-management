import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FamilyDto } from './dto/create-family.dto';
import { FamilyUpdateDto } from './dto/update-family.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: FamilyDto) {
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
        name: newFamily.owner.userProfile[0].fullName,
      },
    };
  }
  async update(data: FamilyUpdateDto) {
    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.family.update({
      where: { id: data.id },
      data: updateData,
    });
  }
}
