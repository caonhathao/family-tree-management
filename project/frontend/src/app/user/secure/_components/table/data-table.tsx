"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllAuthLogs } from "@/modules/user/user.actions";
import { IResponseAuthLog } from "@/modules/user/user.dto";
import { IPaginationBase } from "@/types/base.types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Columns3, MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/shared/toast";
import { IoMdCloseCircle } from "react-icons/io";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { ApiResponse } from "@/types/api.types";

export function DataTable() {
  const [data, setData] =
    useState<IPaginationBase<IResponseAuthLog[] | null>>();
  const [rows, setRows] = useState<number>(10);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const handleCopy = useCopyToClipboard();

  const columns: ColumnDef<IResponseAuthLog>[] = [
    {
      id: "actions",
      cell: ({ row }) => {
        const log = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} className={"h-8 w-8 p-0"}>
                <span className={"sr-only"}>Menu</span>
                <MoreHorizontal className={"h-4 w-4"} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={"end"}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCopy(log.id)}>
                Sao chép ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP",
      cell: ({ row }) => {
        const value = row.getValue("ipAddress") as string;
        return (
          <div className={"max-w-20 truncate"} title={value}>
            {value}
          </div>
        );
      },
    },
    {
      accessorKey: "userAgent",
      header: "Thiết bị",
      cell: ({ row }) => {
        const value = row.getValue("userAgent") as string;
        return (
          <div className={"max-w-20 truncate"} title={value}>
            {value}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Loại",
    },
    {
      accessorKey: "authBy",
      header: "Xác thực bởi",
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }) => {
        const value = row.getValue("createdAt") as string | Date;
        return (
          <span>
            {value ? format(parseISO(String(value)), "dd/MM/yyyy HH:mm") : "—"}
          </span>
        );
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const [isShow, SetIsShow] = useState<boolean>(false);

  const getAuthLog = async (page: number, limit: number) => {
    try {
      const logs:
        | IPaginationBase<IResponseAuthLog[]>
        | ApiResponse<IPaginationBase<IResponseAuthLog[]>, unknown> =
        await getAllAuthLogs(page, limit);
      if (logs && "pagination" in logs) {
        setData(logs);
        SetIsShow(true);
      } else {
        Toaster({
          title: "Hành động thất bại",
          description: (logs as ApiResponse<never, unknown>).message,
          type: "error",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
    } catch (err) {
      console.log(err);
      Toaster({
        title: "Hành động thất bại",
        description: "Không thể tải lịch sử đăng nhập",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  };

  const loadData = async (page: number, limit: number) => {
    try {
      const res:
        | IPaginationBase<IResponseAuthLog[]>
        | ApiResponse<IPaginationBase<IResponseAuthLog[]>, unknown> =
        await getAllAuthLogs(page, limit);

      if ("pagination" in res) {
        setData({
          data: res.data,
          pagination: res.pagination || {
            currentPage: 1,
            pageSize: rows,
            totalItems: 0,
            totalPages: 1,
          },
        });
      } else {
        Toaster({
          title: "Hành động thất bại",
          description: (res as ApiResponse<never, unknown>).message,
          duration: 3000,
          icon: <IoMdCloseCircle />,
          cancel: { label: "OK", onClick: () => {} },
        });
        setData({
          data: [],
          pagination: {
            currentPage: 0,
            pageSize: rows,
            totalItems: 0,
            totalPages: 0,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load table data:", error);
      Toaster({
        title: "Hành động thất bại",
        description: "Không thể tải dữ liệu",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  };

  return (
    <div className={"w-full overflow-hidden rounded-none border"}>
      <div className={"flex items-center justify-end border-b px-4 py-2"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"outline"} className={"ml-auto h-8 gap-2"}>
              <Columns3 className={"h-4 w-4"} />
              <span>Hiển thị</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={"end"}>
            {table
              .getAllLeafColumns()
              .filter(
                (column) => column.getCanHide() && column.id !== "actions",
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                {!isShow ? (
                  <Button variant={"outline"} onClick={() => getAuthLog(1, 10)}>
                    Xem
                  </Button>
                ) : (
                  <p>Không có dữ liệu</p>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className={"flex items-center justify-end px-4"}>
        <div className={"flex w-full justify-end items-center gap-8 lg:w-fit"}>
          <div className={"hidden items-center gap-2 lg:flex"}>
            <Label htmlFor={"rows-per-page"} className={"text-sm font-medium"}>
              dòng mỗi trang
            </Label>
            <Select
              value={rows.toString()}
              onValueChange={(value) => {
                const newRows = Number(value);
                table.setPageSize(newRows);
                setRows(newRows);
                loadData(1, newRows);
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
          <div
            className={
              "flex w-fit items-center justify-center text-sm font-medium"
            }
          >
            trang {data?.pagination?.currentPage || 0} của{" "}
            {data?.pagination?.totalPages || 0}
          </div>
          <div className={"ml-auto flex items-center gap-2 lg:ml-0"}>
            <Button
              variant={"outline"}
              className={"hidden h-8 w-8 p-0 lg:flex hover:cursor-pointer"}
              onClick={() => {
                table.setPageIndex(0);
                loadData(1, rows);
              }}
              disabled={
                data?.pagination ? data.pagination.currentPage - 1 <= 0 : true
              }
            >
              <span className={"sr-only"}>Go to first page</span>
              <MdKeyboardDoubleArrowLeft />
            </Button>
            <Button
              variant={"outline"}
              className={"size-8 hover:cursor-pointer"}
              size={"icon"}
              onClick={() => {
                table.previousPage();
                const prevPage = data?.pagination
                  ? data.pagination.currentPage - 1
                  : 1;
                loadData(prevPage, rows);
              }}
              disabled={
                data?.pagination ? data.pagination.currentPage - 1 <= 0 : true
              }
            >
              <span className={"sr-only"}>Go to previous page</span>
              <MdKeyboardArrowLeft />
            </Button>
            <Button
              variant={"outline"}
              className={"size-8 hover:cursor-pointer"}
              size={"icon"}
              onClick={() => {
                table.nextPage();
                const nextPage = data?.pagination
                  ? data.pagination.currentPage + 1
                  : 1;
                loadData(nextPage, rows);
              }}
              disabled={
                data?.pagination
                  ? data.pagination.currentPage + 1 > data.pagination.totalPages
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
                const lastPage = data?.pagination
                  ? data.pagination.totalPages
                  : 1;
                loadData(lastPage, rows);
              }}
              disabled={
                data?.pagination
                  ? data.pagination.currentPage + 1 > data.pagination.totalPages
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
