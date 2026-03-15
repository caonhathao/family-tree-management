import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Select,
} from "@/components/ui/select";
import { Table } from "@tanstack/react-table";

import { IPagination } from "./data-table";
import { Pagination } from "./pagination";
import { Label } from "@/components/ui/label";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface IPaginationProps<TData> {
  table: Table<TData>;
  pagination?: IPagination;
}
export function FooterTable<TData>({
  table,
  pagination,
}: IPaginationProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handleChangePageSize = (newRows: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("limit", newRows.toString());
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className={"flex items-center justify-between px-4 pt-2"}>
      <div className={"text-muted-foreground hidden flex-1 text-sm lg:flex"}>
        Đã chọn {table.getFilteredSelectedRowModel().rows.length} của{" "}
        {table.getFilteredRowModel().rows.length}
      </div>
      <div className={"flex w-full items-center gap-8 lg:w-fit"}>
        <div className={"hidden items-center gap-2 lg:flex"}>
          <Label htmlFor={"rows-per-page"} className={"text-sm font-medium"}>
            Số hàng mỗi trang
          </Label>
          <Select
            value={pagination?.pageSize.toString() || "10"}
            onValueChange={(value) => {
              const newRows = Number(value);
              table.setPageSize(newRows);
              handleChangePageSize(newRows);
            }}
          >
            <SelectTrigger
              size={"sm"}
              className={"w-20 hover:cursor-pointer"}
              id={"rows-per-page"}
            >
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side={"top"}>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem
                  key={pageSize}
                  value={`${pageSize}`}
                  className={"hover:cursor-pointer"}
                >
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          className={
            "flex w-fit items-center justify-center text-sm font-medium"
          }
        >
          trang {pagination?.currentPage || 0} của {pagination?.totalPages || 0}
        </div>
        <Pagination table={table} pagination={pagination} />
      </div>
    </div>
  );
}
