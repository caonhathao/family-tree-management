import { PrismaClient, ACTION_TYPE, TARGET_TYPE } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedActivityLogs(
  prisma: PrismaClient,
  userCount: number = 10,
  familyCount: number = 5,
  count: number = 25,
): Promise<void> {
  console.log("🌱 Seeding activity logs...");

  const users = await prisma.user.findMany({ take: userCount });
  const families = await prisma.family.findMany({ take: familyCount });

  if (users.length === 0 || families.length === 0) {
    console.log("   ⚠️  No users or families found, skipping activity logs");
    return;
  }

  const activityLogsData = Array.from({ length: count }, () => {
    const family = faker.helpers.arrayElement(families);
    return {
      familyId: family.id,
      userId: faker.helpers.arrayElement(users).id,
      action: faker.helpers.arrayElement([
        ACTION_TYPE.NEW,
        ACTION_TYPE.UPDATE,
        ACTION_TYPE.DELETE,
      ]),
      targetId: faker.string.uuid(),
      target: faker.helpers.arrayElement([
        TARGET_TYPE.ALBUM,
        TARGET_TYPE.FAMILY,
        TARGET_TYPE.EVENT_FAMILY,
        TARGET_TYPE.EVENT_SELF,
        TARGET_TYPE.USER,
      ]),
      content: faker.lorem.sentence(),
    };
  });

  await prisma.activityLog.createMany({
    data: activityLogsData,
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${count} activity logs`);
}

export async function seedAllActivityLogs(prisma: PrismaClient): Promise<void> {
  await seedActivityLogs(prisma, 10, 5);
}

export default seedAllActivityLogs;
