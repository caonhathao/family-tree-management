"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowRight,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardDoubleArrowLeft,
} from "react-icons/md";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getPaginationRowModel: getPaginationRowModel(),
  });

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
    <div className={"w-full p-2"}>
      <div className={"overflow-hidden rounded-md border"}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={"h-24 text-center"}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
          {/* FIX 3: Added Optional Chaining (?.) for safety */}
          <div
            className={
              "flex w-fit items-center justify-center text-sm font-medium"
            }
          >
            trang {pagination?.currentPage || 0} của{" "}
            {pagination?.totalPages || 0}
          </div>
          <div className={"ml-auto flex items-center gap-2 lg:ml-0"}>
            <Button
              variant={"outline"}
              className={"hidden h-8 w-8 p-0 lg:flex hover:cursor-pointer"}
              onClick={() => {
                table.setPageIndex(0);
              }}
              disabled={pagination ? pagination?.currentPage - 1 <= 0 : true}
            >
              <span className={"sr-only"}>Go to first page</span>

              <MdOutlineKeyboardArrowLeft />
            </Button>
            <Button
              variant={"outline"}
              className={"size-8 hover:cursor-pointer"}
              size={"icon"}
              onClick={() => {
                table.previousPage();
              }}
              disabled={pagination ? pagination?.currentPage - 1 <= 0 : true}
            >
              <span className={"sr-only"}>Go to previous page</span>
              <MdOutlineKeyboardDoubleArrowLeft />
            </Button>
            <Button
              variant={"outline"}
              className={"size-8 hover:cursor-pointer"}
              size={"icon"}
              onClick={() => {
                table.nextPage();
              }}
              disabled={
                pagination
                  ? pagination.currentPage + 1 > pagination.totalPages
                  : true
              }
            >
              <span className={"sr-only"}>Go to next page</span>
              <MdKeyboardArrowRight />
            </Button>
            <Button
              variant={"outline"}
              className={"hidden size-8 lg:flex hover:cursor-pointer"}
              size={"icon"}
              onClick={() => {
                table.setPageIndex(table.getPageCount() - 1);
              }}
              disabled={
                pagination
                  ? pagination.currentPage + 1 > pagination.totalPages
                  : true
              }
            >
              <span className={"sr-only"}>Go to last page</span>
              <MdKeyboardDoubleArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
