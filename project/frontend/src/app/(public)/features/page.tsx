import { getBlogAction } from "@/modules/blog/blog.action";
import { cookies } from "next/headers";
import FeatureEditor from "./FeatureEditor";
import { getRoleFromToken } from "@/lib/middleware/auth.lib";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "introduction"; // Default to 'introduction' if no part is specified

  const blog = await getBlogAction(slug);
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const user = await getRoleFromToken(token);

  return <FeatureEditor blog={blog} user={user} />;
}
