"use client";
import { ColumnDef } from "@tanstack/react-table";
import SearchBar from "../_components/search-bar";
import { IErrorResponse, IPaginationBase } from "@/types/base.types";
import { Toaster } from "@/components/shared/toast";
import { useEffect } from "react";
import { DataTable } from "../_components/data-table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: IPaginationBase<TData[]> | IErrorResponse;
}
export function BlogContentPage<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  useEffect(() => {
    if (data && "error" in data) {
      Toaster({
        title: "Hành động thất bại",
        description: data.error,
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  }, [data]);

  return (
    <div
      className={"w-full flex flex-col gap-2 justify-center items-start pt-4"}
    >
      <SearchBar
        placeholder={"Nhập từ khóa ở đây"}
        keyQueryList={["slug", "title"]}
      />
      {data && "error" in data ? null : (
        <DataTable
          columns={columns}
          data={data.data}
          pagination={data.pagination}
        />
      )}
    </div>
  );
}
