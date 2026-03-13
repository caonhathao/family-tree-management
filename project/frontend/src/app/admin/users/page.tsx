"use server";
import { getUserListAction } from "@/modules/user/user.actions";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

export default async function UserPage({
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

  const data = await getUserListAction(
    Number(page),
    Number(limit),
    filterType,
    filter,
  );
  console.log(data);
  if (data && "error" in data) return <div>Có lỗi xảy ra</div>;
  return (
    <DataTable
      columns={columns}
      data={data.data}
      pagination={data.pagination}
    />
  );
}
