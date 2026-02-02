import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RelationshipCreateDto } from './dto/create-relationships.dto';
import { RelationshipUpdateDto } from './dto/update-relationship.dto';
import { Exception } from 'src/common/messages/messages.response';
import { isUUID } from 'class-validator';
import { FamilyMember } from '@prisma/client';

interface IMinimizedMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface IEnrichedFamilyMember extends FamilyMember {
  parents: IMinimizedMember[];
  spouse: IMinimizedMember | null;
  children: IMinimizedMember[];
}

const minimizeMember = (member: FamilyMember): IMinimizedMember => {
  const { id, fullName, avatarUrl } = member;
  return { id, fullName, avatarUrl };
};

@Injectable()
export class RelationshipService {
  constructor(private prisma: PrismaService) {}

  async createMany(data: RelationshipCreateDto[]) {
    try {
      //prepare data
      if (data.length === 0) return { count: 0 };
      const memberIds = new Set<string>();
      for (const item of data) {
        memberIds.add(item.fromMemberId);
        memberIds.add(item.toMemberId);
      }

      const newRelationship = await this.prisma.$transaction(async (tx) => {
        //check unique family id
        const uniqueFamilyId = [...new Set(data.map((item) => item.familyId))];
        if (uniqueFamilyId.length !== 1) {
          throw new BadRequestException(Exception.UNIQUE_INVALID);
        }

        //check member in database
        const membersInDb = await tx.familyMember.findMany({
          where: {
            id: { in: Array.from(memberIds) },
            familyId: uniqueFamilyId[0],
          },
        });

        if (membersInDb.length !== memberIds.size)
          throw new BadRequestException(Exception.SIZE_INVALID);

        // Business Logic Validation
        const values = data
          .map(
            (d) =>
              `('${d.familyId}'::uuid, '${d.fromMemberId}'::uuid, '${d.toMemberId}'::uuid, '${d.type}')`,
          )
          .join(', ');

        const validationResults: any[] = await tx.$queryRawUnsafe(`
  WITH new_rels(family_id, from_id, to_id, rel_type) AS (
    VALUES ${values}
  )
  -- 1. Check member in family
  SELECT 'MEMBER_NOT_IN_FAMILY' as error FROM new_rels nr
  WHERE 
    (SELECT COUNT(*) FROM family_member fm 
     WHERE fm."familyId" = nr.family_id AND fm.id IN (nr.from_id, nr.to_id)) < 2
  
  UNION ALL
  
  -- 2. Check Spouse
  SELECT 'SPOUSE_EXISTS' FROM new_rels nr
  WHERE nr.rel_type = 'SPOUSE' AND EXISTS (
    SELECT 1 FROM relationship r 
    WHERE r."familyId" = nr.family_id AND r.type = 'SPOUSE'
    AND (r."fromMemberId" IN (nr.from_id, nr.to_id) OR r."toMemberId" IN (nr.from_id, nr.to_id))
  )
  
  UNION ALL
  
  -- 3. Check Parent Limit
  SELECT 'PARENT_LIMIT_EXCEEDED' FROM new_rels nr
  WHERE nr.rel_type = 'PARENT' AND (
    SELECT COUNT(*) FROM relationship r 
    WHERE r."toMemberId" = nr.to_id AND r.type = 'PARENT'
  ) >= 2
  
  UNION ALL
  
  -- 4. Check Circular
  SELECT 'CIRCULAR_DEPENDENCY' FROM new_rels nr
  WHERE nr.rel_type = 'PARENT' AND EXISTS (
    SELECT 1 FROM relationship r 
    WHERE r."fromMemberId" = nr.to_id AND r."toMemberId" = nr.from_id AND r.type = 'PARENT'
  );
`);

        if (validationResults.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const error = validationResults[0].error;
          throw new BadRequestException(`Business Logic Error: ${error}`);
        }

        const result = await tx.relationship.createMany({
          data: data,
        });
        return result;
      });

      return newRelationship;
    } catch (err) {
      console.log('error at create relationship service: ', err);
      throw err;
    }
  }

  //get all relationship in family
  async getRelationshipMap(userId: string, familyId: string, groupId: string) {
    if (!isUUID(familyId)) throw new NotFoundException(Exception.NOT_EXIST);

    //check if user is in group or not
    const member = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
        groupMembers: {
          some: {
            memberId: userId,
          },
        },
        family: {
          id: familyId,
        },
      },
    });
    if (!member) throw new ForbiddenException(Exception.PEMRISSION);

    const [members, relationships] = await Promise.all([
      this.prisma.familyMember.findMany({
        where: { familyId },
        orderBy: {
          generation: 'asc',
        },
      }),
      this.prisma.relationship.findMany({
        where: { familyId },
      }),
    ]);

    const membersMap = new Map<string, IEnrichedFamilyMember>(
      members.map((m) => [
        m.id,
        { ...m, parents: [], spouse: null, children: [] },
      ]),
    );

    for (const rel of relationships) {
      const fromMember = membersMap.get(rel.fromMemberId);
      const toMember = membersMap.get(rel.toMemberId);

      if (fromMember && toMember) {
        if (rel.type === 'SPOUSE') {
          fromMember.spouse = minimizeMember(toMember);
          toMember.spouse = minimizeMember(fromMember);
        } else if (rel.type === 'PARENT') {
          // fromMember is parent, toMember is child
          fromMember.children.push(minimizeMember(toMember));
          toMember.parents.push(minimizeMember(fromMember));
        } else if (rel.type === 'CHILD') {
          // fromMember is child, toMember is parent
          fromMember.parents.push(minimizeMember(toMember));
          toMember.children.push(minimizeMember(fromMember));
        }
      }
    }

    const groupedByGeneration: { [key: string]: IEnrichedFamilyMember[] } = {};
    for (const member of membersMap.values()) {
      const generation = member.generation.toString();
      if (!groupedByGeneration[generation]) {
        groupedByGeneration[generation] = [];
      }
      groupedByGeneration[generation].push(member);
    }

    const result: {
      generations: { level: number; members: IEnrichedFamilyMember[] }[];
    } = {
      generations: Object.keys(groupedByGeneration).map((level) => ({
        level: parseInt(level),
        members: groupedByGeneration[level],
      })),
    };

    return result;
  }

  async update(relationshipId: string, data: RelationshipUpdateDto) {
    try {
      if (!isUUID(relationshipId)) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

      const existingRelationship = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
      });

      if (!existingRelationship) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

      const fromMemberId =
        data.fromMemberId || existingRelationship.fromMemberId;
      const toMemberId = data.toMemberId || existingRelationship.toMemberId;

      if (fromMemberId === toMemberId) {
        throw new BadRequestException(Exception.BAD_REQUEST);
      }

      const members = await this.prisma.familyMember.findMany({
        where: {
          id: { in: [fromMemberId, toMemberId] },
          familyId: data.familyId,
        },
      });

      if (members.length !== 2) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

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
    } catch (err) {
      console.log('error at update relationship service: ', err);
      throw err;
    }
  }

  async delete(relationshipId: string, familyId: string) {
    return await this.prisma.relationship.delete({
      where: { id: relationshipId, familyId: familyId },
    });
  }
}
