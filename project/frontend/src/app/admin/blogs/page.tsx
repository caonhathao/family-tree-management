"use server";

import { getBlogsAction } from "@/modules/blog/blog.action";
import { columns } from "./_components/columns";
import { BlogContentPage } from "./page-content";
import { IBlogsDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";
import { IPaginationBase } from "@/types/base.types";

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

  const data: IPaginationBase<IBlogsDto[]> | ApiResponse<IBlogsDto[], unknown> =
    await getBlogsAction(Number(page), Number(limit), filterType, filter);

  return <BlogContentPage columns={columns} data={data} />;
}
