import { PrismaClient, MEMBER_ROLE } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedGroupFamilies(
  prisma: PrismaClient,
  count: number = 5,
): Promise<void> {
  console.log("🌱 Seeding group families...");

  const groupsData = Array.from({ length: count }, () => ({
    name: `${faker.company.name()} Family`,
    description: faker.lorem.sentence(),
  }));

  await prisma.groupFamily.createMany({
    data: groupsData,
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${count} group families`);
}

export async function seedGroupMembers(
  prisma: PrismaClient,
  userCount: number = 10,
  groupCount: number = 5,
): Promise<void> {
  console.log("🌱 Seeding group members...");

  const users = await prisma.user.findMany({ take: userCount });
  const groups = await prisma.groupFamily.findMany({ take: groupCount });

  if (users.length === 0 || groups.length === 0) {
    console.log("   ⚠️  No users or groups found, skipping group members");
    return;
  }

  const membersData: Array<{
    groupId: string;
    memberId: string;
    role: MEMBER_ROLE;
    isLeader: boolean;
  }> = [];

  for (const group of groups) {
    const memberCount = faker.number.int({
      min: 2,
      max: Math.min(5, users.length),
    });
    const shuffledUsers = faker.helpers.arrayElements(users, memberCount);

    for (let i = 0; i < shuffledUsers.length; i++) {
      membersData.push({
        groupId: group.id,
        memberId: shuffledUsers[i].id,
        role:
          i === 0
            ? MEMBER_ROLE.OWNER
            : faker.helpers.arrayElement([
                MEMBER_ROLE.EDITOR,
                MEMBER_ROLE.VIEWER,
              ]),
        isLeader: i === 0,
      });
    }
  }

  await prisma.groupMember.createMany({
    data: membersData,
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${membersData.length} group members`);
}

export async function seedAllGroups(prisma: PrismaClient): Promise<void> {
  await seedGroupFamilies(prisma, 5);
  await seedGroupMembers(prisma, 10, 5);
}

export default seedAllGroups;
