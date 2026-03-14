import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedAlbums(
  prisma: PrismaClient,
  userCount: number = 10,
  familyCount: number = 5,
  count: number = 10,
): Promise<void> {
  console.log("🌱 Seeding albums...");

  const users = await prisma.user.findMany({ take: userCount });
  const families = await prisma.family.findMany({ take: familyCount });

  if (users.length === 0 || families.length === 0) {
    console.log("   ⚠️  No users or families found, skipping albums");
    return;
  }

  const albumsData = Array.from({ length: count }, () => ({
    familyId: faker.helpers.arrayElement(families).id,
    title: `${faker.word.adjective()} ${faker.word.noun()} Album`,
    description: faker.lorem.sentence(),
    createdBy: faker.helpers.arrayElement(users).id,
  }));

  await prisma.album.createMany({ data: albumsData, skipDuplicates: true });
  console.log(`   ✅ Created ${count} albums`);
}

export async function seedPhotos(
  prisma: PrismaClient,
  albumCount: number = 10,
  photosPerAlbum: number = 8,
): Promise<void> {
  console.log("🌱 Seeding photos...");

  const albums = await prisma.album.findMany({ take: albumCount });

  if (albums.length === 0) {
    console.log("   ⚠️  No albums found, skipping photos");
    return;
  }

  for (const album of albums) {
    const photoCount = faker.number.int({ min: 3, max: photosPerAlbum });
    const photosData = Array.from({ length: photoCount }, () => ({
      albumId: album.id,
      imageUrl: faker.image.url(),
      takenAt: faker.date.recent({ days: 365 }).toISOString(),
      locationName: faker.location.city(),
      description: faker.lorem.sentence(),
    }));

    await prisma.photo.createMany({ data: photosData, skipDuplicates: true });
  }

  console.log(`   ✅ Created photos for ${albums.length} albums`);
}

export async function seedAllAlbums(prisma: PrismaClient): Promise<void> {
  await seedAlbums(prisma, 10, 5);
  await seedPhotos(prisma, 10);
}

export default seedAllAlbums;
