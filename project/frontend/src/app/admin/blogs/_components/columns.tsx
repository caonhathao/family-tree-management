"use client";
import { ColumnDef } from "@tanstack/react-table";
import { IBlogsDto } from "@/modules/blog/blog.dto";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<IBlogsDto>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={"Select all"}
        className={"hover:cursor-pointer"}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={"Select row"}
        className={"hover:cursor-pointer"}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "slug",
    header: () => <div className={"w-32 text-left"}>Slug</div>,
    cell: ({ row }) => (
      <div className={"w-32 text-left overflow-hidden"}>
        {row.original.slug}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: () => <div className={"w-44 text-left"}>Tiêu đề</div>,
    cell: ({ row }) => (
      <div className={"w-full text-left overflow-hidden"}>
        {row.original.slug}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => <div className={"w-32 text-left"}>Ngày tạo</div>,
    cell: ({ row }) => (
      <div className={"w-32 text-left"}>
        {row.original.createdAt.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: () => <div className={"w-32 text-left"}>Ngày cập nhật</div>,
    cell: ({ row }) => (
      <div className={"w-32 text-left"}>
        {row.original.createdAt.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"ghost"} className={"h-8 w-8 p-0"}>
              <span className={"sr-only"}>Open menu</span>
              <MoreHorizontal className={"h-4 w-4"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={"end"}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(data.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
