import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  FamilyDto,
  IBiographyContent,
  IFamilyDto,
  IFamilyMemberDto,
  IRelationshipDto,
} from './dto/create-family.dto';
import { Exception } from 'src/common/messages/messages.response';
import { isUUID } from 'class-validator';
import { GENDER, LINEAGE_TYPE, TYPE_RELATIONSHIP } from '@prisma/client';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async syncFamilyData(userId: string, groupId: string, data: FamilyDto) {
    try {
      //check validation
      if (!isUUID(groupId, 'all')) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }
      const syncFamily = await this.prisma.$transaction(async (tx) => {
        // handle family data first
        const family = await tx.family.upsert({
          where: { id: data.family.localId },
          update: {
            name: data.family.name,
            description: data.family.description as string,
            ownerId: userId,
            groupFamilyId: groupId,
            lineageType: data.family.lineageType as LINEAGE_TYPE,
          },
          select: {
            id: true,
            name: true,
            description: true,
            lineageType: true,
          },
          create: {
            id: data.family.localId,
            name: data.family.name,
            description: data.family.description as string,
            ownerId: userId,
            groupFamilyId: groupId,
            lineageType: data.family.lineageType as LINEAGE_TYPE,
          },
        });
        // handle member data
        //remove old members if they were deleted in current
        const incomingMemberIds = data.members.map((m) => m.localId);
        await tx.familyMember.deleteMany({
          where: {
            familyId: family.id,
            id: { notIn: incomingMemberIds },
          },
        });
        const mappingMember = {};
        const saveMembers: IFamilyMemberDto[] = [];
        for (const m of data.members) {
          const savedMember = await tx.familyMember.upsert({
            where: { id: m.localId },
            update: {
              fullName: m.fullName,
              gender: m.gender as GENDER,
              dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : undefined,
              dateOfDeath: m.dateOfDeath ? new Date(m.dateOfDeath) : undefined,
              isAlive: m.isAlive,
              biography: m.biography as IBiographyContent,
              generation: m.generation,
              positionX: m.positionX,
              positionY: m.positionY,
            },
            select: {
              id: true,
              fullName: true,
              gender: true,
              dateOfBirth: true,
              dateOfDeath: true,
              isAlive: true,
              biography: true,
              generation: true,
              positionX: true,
              positionY: true,
            },
            create: {
              id: m.localId,
              familyId: family.id,
              fullName: m.fullName,
              gender: m.gender as GENDER,
              dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : undefined,
              dateOfDeath: m.dateOfDeath ? new Date(m.dateOfDeath) : undefined,
              isAlive: m.isAlive,
              biography: m.biography as IBiographyContent,
              generation: m.generation,
              positionX: m.positionX,
              positionY: m.positionY,
            },
          });
          mappingMember[m.localId] = savedMember.id;
          saveMembers.push({
            localId: m.localId,
            fullName: savedMember.fullName,
            gender: savedMember.gender,
            generation: savedMember.generation,
            dateOfBirth: savedMember.dateOfBirth ?? undefined,
            dateOfDeath: savedMember.dateOfDeath ?? undefined,
            isAlive: savedMember.isAlive,
            biography: savedMember.biography as unknown as IBiographyContent,
            positionX: savedMember.positionX
              ? savedMember.positionX
              : undefined,
            positionY: savedMember.positionY
              ? savedMember.positionY
              : undefined,
          });
        }

        //handle relation data
        await tx.relationship.deleteMany({ where: { familyId: family.id } });

        const savedRelations: IRelationshipDto[] = [];
        for (const r of data.relationships) {
          const rel = await tx.relationship.create({
            data: {
              fromMemberId: mappingMember[r.fromMemberId] as string,
              toMemberId: mappingMember[r.toMemberId] as string,
              type: r.type as TYPE_RELATIONSHIP,
              familyId: family.id,
            },
          });
          savedRelations.push({
            localId: r.localId,
            fromMemberId: rel.fromMemberId,
            toMemberId: rel.toMemberId,
            type: rel.type,
          });
        }

        const allMembers = await tx.familyMember.findMany({
          where: { familyId: family.id },
        });

        return {
          family,
          members: allMembers.map((m) => ({ ...m, localId: m.id })),
          relationships: savedRelations,
        };
      });
      return syncFamily;
    } catch (err) {
      console.error('err at sync family data service:', err);
      throw err;
    }
  }
  async getFamilyData(userId: string, groupId: string) {
    try {
      //check validation
      if (!isUUID(groupId, 'all'))
        throw new NotFoundException(Exception.NOT_EXIST);

      const family = await this.prisma.family.findFirst({
        where: { groupFamilyId: groupId },
        select: {
          id: true,
          name: true,
          description: true,
          lineageType: true,
        },
      });
      if (family !== null) {
        const members = await this.prisma.familyMember.findMany({
          where: { familyId: family.id },
          select: {
            id: true,
            fullName: true,
            gender: true,
            biography: true,
            dateOfBirth: true,
            dateOfDeath: true,
            isAlive: true,
            generation: true,
            positionX: true,
            positionY: true,
          },
        });
        const relationships = await this.prisma.relationship.findMany({
          where: { familyId: family.id },
          select: {
            id: true,
            fromMemberId: true,
            toMemberId: true,
            type: true,
          },
        });
        return {
          members: members.map((m) => ({
            ...m,
            localId: m.id,
            biography: m.biography as unknown as IBiographyContent,
          })),
          relationships: relationships.map((r) => ({
            ...r,
            localId: r.id,
          })),
          family: {
            ...family,
            localId: family.id,
          },
        };
      }
      return {
        members: [],
        relationships: [],
        family: {
          localId: '',
          name: '',
          description: '',
        },
      };
    } catch (err) {
      console.error('err at get family data service:', err);
      throw err;
    }
  }
  async updateFamilyInfo(userId: string, groupId: string, data: IFamilyDto) {
    try {
      //check validation
      if (!isUUID(groupId, 'all'))
        throw new NotFoundException(Exception.NOT_EXIST);

      const family = await this.prisma.family.update({
        where: { id: data.localId },
        data: {
          name: data.name,
          description: data.description as string,
          lineageType: data.lineageType as LINEAGE_TYPE,
        },
        select: {
          id: true,
          name: true,
          description: true,
          lineageType: true,
        },
      });

      if (!family) throw new NotFoundException(Exception.NOT_EXIST);
      return family;
    } catch (err) {
      console.error('err at update family info service:', err);
      throw err;
    }
  }

  async deleteFamilyData(userId: string, groupId: string, familyId: string) {
    try {
      const family = await this.prisma.$transaction(async (tx) => {
        //delete family
        const deletedFamily = await tx.family.delete({
          where: { id: familyId, groupFamilyId: groupId },
          select: {
            id: true,
          },
        });
        return deletedFamily;
      });
      return family;
    } catch (err) {
      console.error('err at delete family data service:', err);
      throw err;
    }
  }
}
