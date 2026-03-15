import { getBlogAction } from "@/modules/blog/blog.action";
import FeatureEditor from "./components/feature-base";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "";

  const blog = await getBlogAction(slug);

  return <FeatureEditor blog={blog} slug={slug} />;
}
