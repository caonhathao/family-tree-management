"use server";
import { getUserListAction } from "@/modules/user/user.actions";
import { columns } from "./_components/columns";
import { UserContentPage } from "./page-content";
import { IPaginationBase } from "@/types/base.types";
import { IUserList } from "@/modules/user/user.dto";
import { ApiResponse } from "@/types/api.types";

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

  const data:
    | IPaginationBase<IUserList[]>
    | ApiResponse<IUserList[], unknown>
    | null = await getUserListAction(
    Number(page),
    Number(limit),
    filterType,
    filter,
  );
  //console.log(data);

  return <UserContentPage columns={columns} data={data} />;
}
