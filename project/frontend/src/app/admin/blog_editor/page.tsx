"use server";
import { getBlogAction, getBlogsAction } from "@/modules/blog/blog.action";
import FeatureEditor from "./_components/FeatureEditor";
import { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";
import { IPaginationBase } from "@/types/base.types";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "";
  //console.log("slug:", slug);

  const blog: IBlogDto | ApiResponse<IBlogDto, unknown> | null =
    await getBlogAction(slug);
  const blogList:
    | IPaginationBase<IBlogsDto[]>
    | ApiResponse<IBlogsDto[], unknown> = await getBlogsAction(1, 100);

  return <FeatureEditor key={slug} blog={blog} slug={slug} list={blogList} />;
}
