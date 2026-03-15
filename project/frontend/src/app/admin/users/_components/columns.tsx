"use client";
import { ColumnDef } from "@tanstack/react-table";
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
import { IUserList } from "@/modules/user/user.dto";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const columns: ColumnDef<IUserList>[] = [
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
    accessorKey: "fullName",
    header: () => <div className={"w-fit text-right"}>Tên</div>,
    cell: ({ row }) => (
      <div className={"w-32 flex flex-row justify-start items-center gap-2"}>
        <Avatar>
          <AvatarImage src={row.original.userProfile?.avatar} />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        {row.original.userProfile?.fullName}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: () => <div className={"w-32 text-left"}>Email</div>,
    cell: ({ row }) => (
      <div className={"w-full text-left"}>{row.original.email}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => <div className={"w-32 text-left"}>Ngày tạo</div>,
    cell: ({ row }) => (
      <div className={"w-full text-left"}>
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
              <span className={"sr-only"}>Mở menu</span>
              <MoreHorizontal className={"h-4 w-4"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={"end"}>
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(data.id)}
            >
              Sao chép ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem variant={"destructive"}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
