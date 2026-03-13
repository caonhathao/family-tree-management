"use server";
import { getBlogAction, getBlogsAction } from "@/modules/blog/blog.action";
import FeatureEditor from "./_components/FeatureEditor";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "";
  //console.log("slug:", slug);

  const blog = await getBlogAction(slug);
  const blogList = await getBlogsAction();

  return <FeatureEditor key={slug} blog={blog} slug={slug} list={blogList} />;
}
