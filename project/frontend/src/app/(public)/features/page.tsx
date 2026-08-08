import { getBlogAction } from "@/modules/blog/blog.action";
import FeatureEditor from "./components/feature-base";
import { IBlogDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ part: string }>;
}) {
  const { part } = await searchParams;
  const slug = part || "";

  const blog: IBlogDto | ApiResponse<IBlogDto, unknown> =
    await getBlogAction(slug);

  return <FeatureEditor blog={blog} slug={slug} />;
}
