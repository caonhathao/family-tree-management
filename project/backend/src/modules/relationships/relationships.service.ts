import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RelationshipCreateDto } from './dto/create-relationships.dto';
import { Exception } from 'src/common/messages/messages.response';
import { RelationshipUpdateDto } from './dto/update-relationship.dto';

@Injectable()
export class RelationshipService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: RelationshipCreateDto) {
    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: { familyId: data.familyId, memberId: userId },
    });

    if (!groupFamily) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    const newRelationship = await this.prisma.relationship.create({
      data: {
        ...data,
      },
      select: {
        id: true,
        familyId: true,
        fromMemberId: true,
        toMemberId: true,
        type: true,
      },
    });

    return newRelationship;
  }

  async update(
    userId: string,
    relationshipId: string,
    data: RelationshipUpdateDto,
  ) {
    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: { familyId: data.familyId, memberId: userId },
    });

    if (!groupFamily) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: updateData,
    });
  }

  async delete(userId: string, relationshipId: string, familyId: string) {
    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: { familyId: familyId, memberId: userId },
    });

    if (!groupFamily) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    return await this.prisma.relationship.delete({
      where: { id: relationshipId },
    });
  }
}
