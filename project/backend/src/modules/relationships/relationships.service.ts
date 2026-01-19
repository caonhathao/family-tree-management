import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RelationshipCreateDto } from './dto/create-relationships.dto';
import { RelationshipUpdateDto } from './dto/update-relationship.dto';

@Injectable()
export class RelationshipService {
  constructor(private prisma: PrismaService) {}

  async create(data: RelationshipCreateDto) {
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

  async update(relationshipId: string, data: RelationshipUpdateDto) {
    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: updateData,
      select: {
        id: true,
        familyId: true,
        fromMemberId: true,
        toMemberId: true,
        type: true,
      },
    });
  }

  async delete(relationshipId: string, familyId: string) {
    return await this.prisma.relationship.delete({
      where: { id: relationshipId, familyId: familyId },
    });
  }
}
