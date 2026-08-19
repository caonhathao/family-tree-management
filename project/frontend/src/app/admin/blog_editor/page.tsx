"use server";
import { getBlogAction, getBlogsAction } from "@/modules/blog/blog.action";
import FeatureEditor from "./_components/FeatureEditor";
import { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "";

  const blog: ApiResponse<IBlogDto, unknown> = await getBlogAction(slug);
  const blogList: ApiResponse<IBlogsDto[]> = await getBlogsAction(1, 100);

  return <FeatureEditor key={slug} blog={blog} slug={slug} list={blogList} />;
}
