"use client";
import { Button } from "@/components/ui/button";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardDoubleArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IPaginationProps } from "./footer-table";

export function Pagination<TData>({
  table,
  pagination,
}: IPaginationProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChangePage = (newRows: number, page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("limit", newRows.toString());
    params.set("page", page.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={"ml-auto flex items-center gap-2 lg:ml-0"}>
      <Button
        variant={"outline"}
        className={"hidden h-8 w-8 p-0 lg:flex hover:cursor-pointer"}
        onClick={() => {
          table.setPageIndex(0);
          handleChangePage(10, 1);
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
          handleChangePage(10, (pagination?.currentPage ?? 1) - 1);
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
          handleChangePage(10, (pagination?.currentPage ?? 1) + 1);
        }}
        disabled={
          pagination ? pagination.currentPage + 1 > pagination.totalPages : true
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
          handleChangePage(10, pagination?.totalPages ?? 1);
        }}
        disabled={
          pagination ? pagination.currentPage + 1 > pagination.totalPages : true
        }
      >
        <span className={"sr-only"}>Go to last page</span>
        <MdKeyboardDoubleArrowRight />
      </Button>
    </div>
  );
}
