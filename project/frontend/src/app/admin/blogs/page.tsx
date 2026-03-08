"use server";

import { getBlogsAction } from "@/modules/blog/blog.action";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

export default async function BlogPage() {
  const data = await getBlogsAction();

  if (data && "error" in data) return <div>Có lỗi xảy ra</div>;

  return (
    <div className={"container p-5"}>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
