"use client";
import { ColumnDef } from "@tanstack/react-table";
import SearchBar from "../_components/search-bar";
import { DataTable } from "./_components/data-table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
export function UserContentPage<TData, TValue>({
  columns,
  data,
  pagination,
}: DataTableProps<TData, TValue>) {
  return (
    <div
      className={"w-full flex flex-col gap-2 justify-center items-start pt-4"}
    >
      <SearchBar
        placeholder={"Nhập từ khóa ở đây"}
        keyQueryList={["Email", "Tên"]}
      />
      <DataTable columns={columns} data={data} pagination={pagination} />
    </div>
  );
}
