import { PrismaClient } from "@prisma/client";
import { seedAllUsers, clearCredentialsFile } from "./seeds/user.seed";
import seedAllGroups from "./seeds/group.seed";
import seedAllFamilies from "./seeds/family.seed";
import seedAllBlogs from "./seeds/blog.seed";
import seedAllAlbums from "./seeds/album.seed";
import seedAllEvents from "./seeds/event.seed";
import seedAllNotifications from "./seeds/notification.seed";
import seedAllInvites from "./seeds/invite.seed";
import seedAllActivityLogs from "./seeds/activity-log.seed";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });

// 2. Khởi tạo Adapter cho Prisma
const adapter = new PrismaPg(pool);

// 3. Khởi tạo PrismaClient với adapter (Đúng chuẩn Prisma 7)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting database seeding...\n");
  console.log("=".repeat(50));

  try {
    await clearCredentialsFile();
    console.log("📄 Credentials file cleared\n");

    console.log(
      "\n📌 Step 1: Users (including admin), Accounts, Profiles, Sessions, Verifications",
    );
    await seedAllUsers(prisma);
    console.log("   ✅ Step 1 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 2: Group Families & Group Members");
    await seedAllGroups(prisma);
    console.log("   ✅ Step 2 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 3: Families, Family Members & Relationships");
    await seedAllFamilies(prisma);
    console.log("   ✅ Step 3 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 4: Blogs & Blog Media");
    await seedAllBlogs(prisma);
    console.log("   ✅ Step 4 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 5: Albums & Photos");
    await seedAllAlbums(prisma);
    console.log("   ✅ Step 5 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 6: Events");
    await seedAllEvents(prisma);
    console.log("   ✅ Step 6 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 7: Notifications");
    await seedAllNotifications(prisma);
    console.log("   ✅ Step 7 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 8: Invites");
    await seedAllInvites(prisma);
    console.log("   ✅ Step 8 completed\n");

    console.log("=".repeat(50));
    console.log("\n📌 Step 9: Activity Logs");
    await seedAllActivityLogs(prisma);
    console.log("   ✅ Step 9 completed\n");

    console.log("=".repeat(50));
    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📄 Credentials saved to: generated_credentials.txt");
    console.log("   (Check the root directory of your project)");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database disconnected");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
