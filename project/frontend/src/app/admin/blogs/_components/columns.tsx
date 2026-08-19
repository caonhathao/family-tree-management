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
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteBlogAction } from "@/modules/blog/blog.action";
import { Toaster } from "@/components/shared/toast";

function BlogActionsCell({ data }: { data: IBlogsDto }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          className={"h-8 w-8 p-0 hover:shadow-sm active:scale-[0.98]"}
        >
          <span className={"sr-only"}>Open menu</span>
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
        <DropdownMenuItem
          onClick={() => router.push(`/admin/blog_editor?part=${data.slug}`)}
        >
          Chỉnh sửa
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className={"text-destructive"}
              onSelect={(e) => e.preventDefault()}
            >
              Xóa
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa bài viết</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa bài viết &quot;{data.title}
                &quot;? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className={"bg-destructive text-white hover:bg-destructive/90"}
                onClick={async () => {
                  const res = await deleteBlogAction(data.slug);
                  if (res && "id" in res) {
                    Toaster({
                      title: "Thành công",
                      description: "Đã xóa bài viết",
                      type: "success",
                      cancel: { label: "OK", onClick: () => {} },
                    });
                    router.refresh();
                  } else {
                    Toaster({
                      title: "Thất bại",
                      description:
                        (res as { message?: string }).message ||
                        "Không thể xóa bài viết",
                      type: "error",
                      cancel: { label: "OK", onClick: () => {} },
                    });
                  }
                }}
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => <div className={"w-32 text-left"}>Ngày tạo</div>,
    cell: ({ row }) => (
      <div className={"w-32 text-left"}>
        {new Date(row.original.createdAt).toLocaleString("vi-VN", {
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
        {new Date(row.original.updatedAt).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <BlogActionsCell data={row.original} />,
  },
];
