import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedInvites(
  prisma: PrismaClient,
  userCount: number = 10,
  groupCount: number = 5,
  count: number = 15,
): Promise<void> {
  console.log("🌱 Seeding invites...");

  const users = await prisma.user.findMany({ take: userCount });
  const groups = await prisma.groupFamily.findMany({ take: groupCount });

  if (users.length === 0 || groups.length === 0) {
    console.log("   ⚠️  No users or groups found, skipping invites");
    return;
  }

  const invitesData = Array.from({ length: count }, () => ({
    token: faker.string.alphanumeric(32),
    groupId: faker.helpers.arrayElement(groups).id,
    senderId: faker.helpers.arrayElement(users).id,
    expiresAt: faker.date.future({ years: 1 }),
  }));

  await prisma.invite.createMany({ data: invitesData, skipDuplicates: true });
  console.log(`   ✅ Created ${count} invites`);
}

export async function seedAllInvites(prisma: PrismaClient): Promise<void> {
  await seedInvites(prisma, 10, 5);
}

export default seedAllInvites;
