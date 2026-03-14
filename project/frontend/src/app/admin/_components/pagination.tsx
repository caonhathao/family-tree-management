import { Button } from "@/components/ui/button";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardDoubleArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { IPagination } from "../users/_components/data-table";
import { Table } from "@tanstack/react-table";

interface IPaginationProps<TData> {
  table: Table<TData>;
  pagination?: IPagination;
}

export function Pagination<TData>({
  table,
  pagination,
}: IPaginationProps<TData>) {
  return (
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
