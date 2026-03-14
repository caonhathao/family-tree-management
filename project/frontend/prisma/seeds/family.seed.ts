import {
  PrismaClient,
  LINEAGE_TYPE,
  GENDER,
  TYPE_RELATIONSHIP,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedFamilies(
  prisma: PrismaClient,
  userCount: number = 10,
  groupCount: number = 5,
): Promise<void> {
  console.log("🌱 Seeding families...");

  const users = await prisma.user.findMany({ take: userCount });
  const groupFamilies = await prisma.groupFamily.findMany({ take: groupCount });

  if (users.length === 0 || groupFamilies.length === 0) {
    console.log("   ⚠️  No users or groups found, skipping families");
    return;
  }

  const familiesData = groupFamilies.map((group) => ({
    name: `${group.name} Tree`,
    description: faker.lorem.paragraph(),
    lineageType: faker.helpers.arrayElement([
      LINEAGE_TYPE.PATRIARCHAL,
      LINEAGE_TYPE.MATRIARCHAL,
      LINEAGE_TYPE.OTHER,
    ]),
    ownerId: users[Math.floor(Math.random() * users.length)].id,
    groupFamilyId: group.id,
  }));

  await prisma.family.createMany({ data: familiesData, skipDuplicates: true });
  console.log(`   ✅ Created ${familiesData.length} families`);
}

export async function seedFamilyMembers(
  prisma: PrismaClient,
  familyCount: number = 5,
  membersPerFamily: number = 8,
): Promise<void> {
  console.log("🌱 Seeding family members...");

  const families = await prisma.family.findMany({ take: familyCount });

  if (families.length === 0) {
    console.log("   ⚠️  No families found, skipping family members");
    return;
  }

  for (const family of families) {
    const membersData = Array.from({ length: membersPerFamily }, (_, i) => ({
      familyId: family.id,
      fullName: faker.person.fullName(),
      gender: faker.helpers.arrayElement([
        GENDER.MALE,
        GENDER.FEMALE,
        GENDER.OTHER,
      ]),
      dateOfBirth: faker.date.birthdate({ min: 1940, max: 2015, mode: "year" }),
      isAlive: faker.datatype.boolean({ probability: 0.85 }),
      avatarUrl: faker.image.avatar(),
      biography: {
        occupation: faker.person.jobTitle(),
        birthplace: faker.location.city(),
      },
      generation: Math.floor(i / 2) + 1,
      positionX: faker.number.float({ min: 0, max: 1000 }),
      positionY: faker.number.float({ min: 0, max: 1000 }),
    }));

    await prisma.familyMember.createMany({
      data: membersData,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Created family members for ${families.length} families`);
}

export async function seedRelationships(
  prisma: PrismaClient,
  familyCount: number = 5,
  membersPerFamily: number = 8,
): Promise<void> {
  console.log("🌱 Seeding relationships...");

  const families = await prisma.family.findMany({ take: familyCount });

  if (families.length === 0) {
    console.log("   ⚠️  No families found, skipping relationships");
    return;
  }

  for (const family of families) {
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      take: membersPerFamily,
    });

    if (members.length < 2) continue;

    const relationshipsData: Array<{
      familyId: string;
      fromMemberId: string;
      toMemberId: string;
      type: TYPE_RELATIONSHIP;
    }> = [];

    for (let i = 0; i < members.length - 1; i += 2) {
      if (i + 1 < members.length) {
        relationshipsData.push({
          familyId: family.id,
          fromMemberId: members[i].id,
          toMemberId: members[i + 1].id,
          type: TYPE_RELATIONSHIP.SPOUSE,
        });
      }
    }

    if (members.length >= 4) {
      relationshipsData.push({
        familyId: family.id,
        fromMemberId: members[0].id,
        toMemberId: members[2].id,
        type: TYPE_RELATIONSHIP.PARENT,
      });

      relationshipsData.push({
        familyId: family.id,
        fromMemberId: members[2].id,
        toMemberId: members[3].id,
        type: TYPE_RELATIONSHIP.CHILD,
      });
    }

    await prisma.relationship.createMany({
      data: relationshipsData,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Created relationships for ${families.length} families`);
}

export async function seedAllFamilies(prisma: PrismaClient): Promise<void> {
  await seedFamilies(prisma, 10, 5);
  await seedFamilyMembers(prisma, 5);
  await seedRelationships(prisma, 5);
}

export default seedAllFamilies;
