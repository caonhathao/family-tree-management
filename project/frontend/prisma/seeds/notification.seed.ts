import { PrismaClient, NOTIFICATION_TYPE } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedNotifications(
  prisma: PrismaClient,
  userCount: number = 10,
  count: number = 30,
): Promise<void> {
  console.log("🌱 Seeding notifications...");

  const users = await prisma.user.findMany({ take: userCount });

  if (users.length === 0) {
    console.log("   ⚠️  No users found, skipping notifications");
    return;
  }

  const notificationsData = Array.from({ length: count }, () => ({
    userId: faker.helpers.arrayElement(users).id,
    title: faker.lorem.sentence({ min: 2, max: 6 }),
    content: faker.lorem.sentence(),
    type: faker.helpers.arrayElement([
      NOTIFICATION_TYPE.NEW,
      NOTIFICATION_TYPE.UPDATE,
      NOTIFICATION_TYPE.DELETE,
      NOTIFICATION_TYPE.OTHER,
    ]),
    isRead: faker.datatype.boolean({ probability: 0.4 }),
    link: faker.internet.url(),
  }));

  await prisma.notification.createMany({
    data: notificationsData,
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${count} notifications`);
}

export async function seedAllNotifications(
  prisma: PrismaClient,
): Promise<void> {
  await seedNotifications(prisma, 10);
}

export default seedAllNotifications;
