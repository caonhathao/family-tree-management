import { PrismaClient, USER_ROLE, GENDERS } from "@prisma/client";
import { faker } from "@faker-js/faker";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

const CREDENTIALS_FILE = path.join(process.cwd(), "generated_credentials.txt");

export async function clearCredentialsFile(): Promise<void> {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

export async function appendCredential(
  email: string,
  password: string,
): Promise<void> {
  fs.appendFileSync(
    CREDENTIALS_FILE,
    `Email: ${email} | Password: ${password}\n`,
  );
}

function generatePlainPassword(): string {
  return faker.internet.password({ length: 12, memorable: true });
}

export async function seedUsers(
  prisma: PrismaClient,
  count: number = 10,
): Promise<void> {
  console.log("🌱 Seeding users...");

  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123!@#";

  await prisma.user.create({
    data: {
      email: adminEmail,
      emailVerified: true,
      role: USER_ROLE.ADMIN,
      account: {
        create: {
          password: await bcrypt.hash(adminPassword, 12),
        },
      },
      userProfile: {
        create: {
          fullName: "Admin User",
          gender: GENDERS.MALE,
          dateOfBirth: new Date("1990-01-01"),
        },
      },
    },
  });

  await appendCredential(adminEmail, adminPassword);
  console.log(`   ✅ Created admin user: ${adminEmail}`);

  const usersData = Array.from({ length: count }, (_, i) => {
    const email = faker.internet.email().toLowerCase();
    const plainPassword = generatePlainPassword();

    return {
      email,
      plainPassword,
      role: i < 2 ? USER_ROLE.ADMIN : USER_ROLE.USER,
      fullName: faker.person.fullName(),
      gender: faker.helpers.arrayElement([
        GENDERS.MALE,
        GENDERS.FEMALE,
        GENDERS.UNKNOWN,
      ]),
      dateOfBirth: faker.date.birthdate({ min: 1960, max: 2005, mode: "year" }),
      avatar: faker.image.avatar(),
      biography: faker.lorem.paragraph(),
    };
  });

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.plainPassword, 12);

    await prisma.user.create({
      data: {
        email: userData.email,
        emailVerified: faker.datatype.boolean(),
        role: userData.role,
        account: {
          create: {
            password: hashedPassword,
          },
        },
        userProfile: {
          create: {
            fullName: userData.fullName,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth,
            avatar: userData.avatar,
            biography: userData.biography,
          },
        },
      },
    });

    await appendCredential(userData.email, userData.plainPassword);
  }

  console.log(`   ✅ Created ${count + 1} users (including admin)`);
}

export async function seedSessions(
  prisma: PrismaClient,
  userCount: number = 10,
): Promise<void> {
  console.log("🌱 Seeding sessions...");

  const users = await prisma.user.findMany({ take: userCount, skip: 1 });
  const sessionsData = users
    .slice(0, Math.min(5, users.length))
    .map((user) => ({
      userId: user.id,
      token: faker.string.alphanumeric(64),
      expiresAt: faker.date.future({ years: 1 }),
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
    }));

  await prisma.session.createMany({ data: sessionsData, skipDuplicates: true });
  console.log(`   ✅ Created ${sessionsData.length} sessions`);
}

export async function seedVerifications(
  prisma: PrismaClient,
  count: number = 10,
): Promise<void> {
  console.log("🌱 Seeding verifications...");

  const users = await prisma.user.findMany({
    where: { emailVerified: false },
    take: count,
  });

  const verificationsData = users.map((user) => ({
    identifier: user.email,
    value: faker.string.alphanumeric(32),
    expiresAt: faker.date.future({ years: 1 }),
  }));

  await prisma.verification.createMany({
    data: verificationsData,
    skipDuplicates: true,
  });
  console.log(`   ✅ Created ${verificationsData.length} verifications`);
}

export async function seedAllUsers(prisma: PrismaClient): Promise<void> {
  await seedUsers(prisma, 10);
  await seedSessions(prisma, 10);
  await seedVerifications(prisma, 10);
}

export default seedAllUsers;
