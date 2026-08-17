import { NotFoundException } from '@nestjs/common';
import { GENDER, LINEAGE_TYPE, TYPE_RELATIONSHIP } from '@prisma/client';
import { FamilyService } from './family.service';
import { FamilyDto, IBiographyContent } from './dto/create-family.dto';

interface TxMock {
  family: { upsert: jest.Mock };
  familyMember: {
    deleteMany: jest.Mock;
    upsert: jest.Mock;
    findMany: jest.Mock;
  };
  relationship: { deleteMany: jest.Mock; create: jest.Mock };
}

interface MemberCreateInput {
  id: string;
  fullName: string;
  gender: GENDER;
  generation: number;
  dateOfBirth?: string;
  dateOfDeath?: string;
  isAlive?: boolean;
  biography?: IBiographyContent;
  positionX?: number;
  positionY?: number;
}

describe('FamilyService', () => {
  let service: FamilyService;
  let prisma: {
    family: { findFirst: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: TxMock;

  const userId = 'user-1';
  const groupId = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
  const familyId = '3f2504e0-4f89-11d3-9a0c-0305e82c3302';
  const memberId = '3f2504e0-4f89-11d3-9a0c-0305e82c3310';

  const biography: IBiographyContent = {
    education_level: 'University',
    occupation: 'Engineer',
    hometown: 'Hanoi',
    achievements: 'none',
  };

  const data: FamilyDto = {
    family: {
      localId: familyId,
      name: 'Nguyen Family',
      description: 'desc',
      lineageType: LINEAGE_TYPE.PATRIARCHAL,
    },
    members: [
      {
        localId: memberId,
        fullName: 'Nguyen Van A',
        gender: GENDER.MALE,
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        dateOfDeath: undefined,
        isAlive: true,
        biography,
        generation: 1,
        positionX: 10,
        positionY: 20,
      },
    ],
    relationships: [
      {
        localId: '3f2504e0-4f89-11d3-9a0c-0305e82c3320',
        fromMemberId: memberId,
        toMemberId: memberId,
        type: TYPE_RELATIONSHIP.PARENT,
      },
    ],
  };

  beforeEach(() => {
    tx = {
      family: { upsert: jest.fn() },
      familyMember: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      relationship: { deleteMany: jest.fn(), create: jest.fn() },
    };

    prisma = {
      family: { findFirst: jest.fn(), update: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn: unknown) => {
        if (typeof fn === 'function') {
          return (fn as (t: TxMock) => Promise<unknown>)(tx);
        }
        return Promise.resolve();
      }),
    };

    service = new FamilyService(prisma as never);
  });

  describe('syncFamilyData', () => {
    it('throws NotFoundException when groupId is not a valid UUID', async () => {
      await expect(
        service.syncFamilyData(userId, 'not-a-uuid', data),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('upserts the family, deletes removed members and recreates relationships', async () => {
      tx.family.upsert.mockResolvedValue({
        id: familyId,
        name: 'Nguyen Family',
        description: 'desc',
        lineageType: LINEAGE_TYPE.PATRIARCHAL,
      });
      tx.familyMember.upsert.mockImplementation(
        ({ create }: { create: MemberCreateInput }) =>
          Promise.resolve({
            id: create.id,
            fullName: create.fullName,
            gender: create.gender,
            generation: create.generation,
            dateOfBirth: create.dateOfBirth
              ? new Date(create.dateOfBirth)
              : null,
            dateOfDeath: create.dateOfDeath
              ? new Date(create.dateOfDeath)
              : null,
            isAlive: create.isAlive,
            biography: create.biography,
            positionX: create.positionX,
            positionY: create.positionY,
          }),
      );
      tx.relationship.create.mockResolvedValue({
        id: 'rel-1',
        fromMemberId: memberId,
        toMemberId: memberId,
        type: TYPE_RELATIONSHIP.PARENT,
      });
      tx.familyMember.findMany.mockResolvedValue([
        {
          id: memberId,
          familyId,
          fullName: 'Nguyen Van A',
          gender: GENDER.MALE,
          generation: 1,
          biography,
          isAlive: true,
          positionX: 10,
          positionY: 20,
        },
      ]);

      const result = await service.syncFamilyData(userId, groupId, data);

      expect(tx.family.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: familyId },
          create: expect.objectContaining({
            id: familyId,
            name: 'Nguyen Family',
            ownerId: userId,
            groupFamilyId: groupId,
          }) as {
            id: string;
            name: string;
            ownerId: string;
            groupFamilyId: string;
          },
        }),
      );

      expect(tx.familyMember.deleteMany).toHaveBeenCalledWith({
        where: { familyId, id: { notIn: [memberId] } },
      });

      expect(tx.relationship.deleteMany).toHaveBeenCalledWith({
        where: { familyId },
      });

      expect(tx.relationship.create).toHaveBeenCalledWith({
        data: {
          fromMemberId: memberId,
          toMemberId: memberId,
          type: TYPE_RELATIONSHIP.PARENT,
          familyId,
        },
      });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].localId).toBe(memberId);
      expect(result.family.name).toBe('Nguyen Family');
    });

    it('maps localIds to persisted ids when creating relationships', async () => {
      const localIdA = memberId;
      const localIdB = '3f2504e0-4f89-11d3-9a0c-0305e82c3311';
      const persistedB = 'persisted-b-id';

      const twoMembers: FamilyDto = {
        ...data,
        members: [
          {
            localId: localIdA,
            fullName: 'Member A',
            gender: GENDER.MALE,
            generation: 1,
          },
          {
            localId: localIdB,
            fullName: 'Member B',
            gender: GENDER.FEMALE,
            generation: 1,
          },
        ],
        relationships: [
          {
            localId: 'rel-local',
            fromMemberId: localIdA,
            toMemberId: localIdB,
            type: TYPE_RELATIONSHIP.SPOUSE,
          },
        ],
      };

      tx.family.upsert.mockResolvedValue({ id: familyId, name: 'Family' });
      tx.familyMember.upsert.mockImplementation(
        ({ create }: { create: MemberCreateInput }) =>
          Promise.resolve({
            id: create.id === localIdB ? persistedB : create.id,
            fullName: create.fullName,
            gender: create.gender,
            generation: create.generation,
            dateOfBirth: null,
            dateOfDeath: null,
            isAlive: true,
          }),
      );
      tx.relationship.create.mockImplementation(({ data: r }) =>
        Promise.resolve({ id: 'rel-saved', ...r }),
      );
      tx.familyMember.findMany.mockResolvedValue([]);

      await service.syncFamilyData(userId, groupId, twoMembers);

      expect(tx.relationship.create).toHaveBeenCalledWith({
        data: {
          fromMemberId: localIdA,
          toMemberId: persistedB,
          type: TYPE_RELATIONSHIP.SPOUSE,
          familyId,
        },
      });
    });
  });

  describe('getFamilyData', () => {
    it('returns empty family shape when no family exists for the group', async () => {
      prisma.family.findFirst.mockResolvedValue(null);

      const result = await service.getFamilyData(userId, groupId);

      expect(result).toEqual({
        members: [],
        relationships: [],
        family: {
          localId: '',
          name: '',
          description: '',
          lineageType: LINEAGE_TYPE.PATRIARCHAL,
        },
      });
    });

    it('throws NotFoundException when groupId is invalid', async () => {
      await expect(service.getFamilyData(userId, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
