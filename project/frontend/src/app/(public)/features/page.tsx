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

  const blogFetch: ApiResponse<IBlogDto> | null = slug
    ? await getBlogAction(slug)
    : null;

  if (blogFetch && "data" in blogFetch) {
    return <FeatureEditor blog={blogFetch.data} slug={slug} />;
  }
}
