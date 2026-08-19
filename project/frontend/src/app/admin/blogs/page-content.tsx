"use client";
import { ColumnDef } from "@tanstack/react-table";
import SearchBar from "../_components/search-bar";
import { IPaginationBase } from "@/types/base.types";
import { Toaster } from "@/components/shared/toast";
import { useEffect } from "react";
import { DataTable } from "../_components/data-table";
import { IBlogsDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: IPaginationBase<TData[]> | ApiResponse<IBlogsDto[], unknown>;
}
export function BlogContentPage<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  useEffect(() => {
    if (data && "errors" in data) {
      Toaster({
        title: "Hành động thất bại",
        description: data.message,
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
      {data && "pagination" in data && "data" in data ? (
        <DataTable
          columns={columns}
          data={data.data}
          pagination={data.pagination}
          defaultColumnVisibility={{ createdAt: false, updatedAt: false }}
        />
      ) : null}
    </div>
  );
}
