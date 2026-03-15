"use server";

import { getBlogsAction } from "@/modules/blog/blog.action";
import { columns } from "./_components/columns";
import { BlogContentPage } from "./page-content";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    limit: string;
    filterType: string;
    filter: string;
  }>;
}) {
  const { page, limit, filterType, filter } = await searchParams;

  const data = await getBlogsAction(
    Number(page),
    Number(limit),
    filterType,
    filter,
  );

  return <BlogContentPage columns={columns} data={data} />;
}
