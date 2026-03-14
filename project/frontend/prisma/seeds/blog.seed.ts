import { PrismaClient, BLOG_MEDIA_TYPE } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedBlogs(
  prisma: PrismaClient,
  userCount: number = 10,
  count: number = 15,
): Promise<void> {
  console.log("🌱 Seeding blogs...");

  const users = await prisma.user.findMany({ take: userCount });

  if (users.length === 0) {
    console.log("   ⚠️  No users found, skipping blogs");
    return;
  }

  const blogsData = Array.from({ length: count }, () => {
    const title = faker.lorem.sentence({ min: 3, max: 8 });
    return {
      userId: faker.helpers.arrayElement(users).id,
      title,
      slug:
        faker.helpers.slugify(title.toLowerCase()) +
        "-" +
        faker.string.alphanumeric(6),
      content: faker.lorem.paragraphs(3),
    };
  });

  await prisma.blog.createMany({ data: blogsData, skipDuplicates: true });
  console.log(`   ✅ Created ${count} blogs`);
}

export async function seedBlogMedia(
  prisma: PrismaClient,
  blogCount: number = 15,
  mediaPerBlog: number = 3,
): Promise<void> {
  console.log("🌱 Seeding blog media...");

  const blogs = await prisma.blog.findMany({ take: blogCount });

  if (blogs.length === 0) {
    console.log("   ⚠️  No blogs found, skipping blog media");
    return;
  }

  for (const blog of blogs) {
    const mediaCount = faker.number.int({ min: 1, max: mediaPerBlog });
    const mediaData = Array.from({ length: mediaCount }, () => ({
      blogId: blog.id,
      url: faker.image.url(),
      type: faker.helpers.arrayElement([
        BLOG_MEDIA_TYPE.IMAGE,
        BLOG_MEDIA_TYPE.VIDEO,
        BLOG_MEDIA_TYPE.OTHER,
      ]),
      isUsed: faker.datatype.boolean(),
    }));

    await prisma.blogMedia.createMany({
      data: mediaData,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Created blog media for ${blogs.length} blogs`);
}

export async function seedAllBlogs(prisma: PrismaClient): Promise<void> {
  await seedBlogs(prisma, 10);
  await seedBlogMedia(prisma, 15);
}

export default seedAllBlogs;
