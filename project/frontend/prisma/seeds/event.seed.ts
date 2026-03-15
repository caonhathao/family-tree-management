import { PrismaClient, EVENT_TYPE } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedEvents(
  prisma: PrismaClient,
  userCount: number = 10,
  familyCount: number = 5,
  count: number = 20,
): Promise<void> {
  console.log("🌱 Seeding events...");

  const users = await prisma.user.findMany({ take: userCount });
  const families = await prisma.family.findMany({ take: familyCount });

  if (users.length === 0 || families.length === 0) {
    console.log("   ⚠️  No users or families found, skipping events");
    return;
  }

  const eventsData = Array.from({ length: count }, () => ({
    familyId: faker.helpers.arrayElement(families).id,
    title: faker.lorem.sentence({ min: 2, max: 5 }),
    description: faker.lorem.paragraph(),
    eventDate: faker.date.future({ years: 2 }),
    isRecurring: faker.datatype.boolean({ probability: 0.7 }),
    type: faker.helpers.arrayElement([
      EVENT_TYPE.BIRTHDAY,
      EVENT_TYPE.DEATH_ANNIVERSARY,
      EVENT_TYPE.WEDDING,
      EVENT_TYPE.OTHER,
    ]),
    createBy: faker.helpers.arrayElement(users).id,
  }));

  await prisma.event.createMany({ data: eventsData, skipDuplicates: true });
  console.log(`   ✅ Created ${count} events`);
}

export async function seedAllEvents(prisma: PrismaClient): Promise<void> {
  await seedEvents(prisma, 10, 5);
}

export default seedAllEvents;
