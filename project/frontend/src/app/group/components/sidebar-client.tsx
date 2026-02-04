"use client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import { HiDotsVertical } from "react-icons/hi";
import logo from "../../../../public/img/family-tree-logo.png";
import { IoIosArrowForward, IoMdHome } from "react-icons/io";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdOutlineContactSupport } from "react-icons/md";

export const SideBarClient = ({
  data,
}: {
  data: ResponseGroupFamiliesDto[];
}) => {
  const router = useRouter();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row justify-between items-center">
        <SidebarMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size={"lg"}
                className="min-h-12 hover:cursor-pointer w-full flex flex-row justify-between items-center"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                  <Image
                    src={logo.src}
                    width={2000}
                    height={2000}
                    alt="logo"
                    className="rounded-lg w-10 border-2"
                  />
                </div>
                <div className="font-bold group-data-[collapsible=icon]:hidden">
                  Nhóm của bạn
                </div>
                <IoIosArrowForward />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => router.push("/")}
              >
                <IoMdHome />
                Về trang chủ
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => router.push("/")}
              >
                <MdOutlineContactSupport />
                Hướng dẫn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarGroup>
        <SidebarContent>
          {data && data.length === 0 ? (
            <div className="w-full flex flex-col justify-center items-center gap-3 group-data-[collapsible=icon]:hidden">
              <p className="italic">Không có nhóm nào</p>
              <Button variant={"outline"} className="hover:cursor-pointer">
                Tạo nhóm mới
              </Button>
            </div>
          ) : (
            data.map((item, index) => (
              <div
                key={index}
                className="px-2 py-1 flex flex-row justify-between items-center gap-3"
              >
                <div className="max-w-[75%]">{item.name}</div>
                <div className="max-w-[25%]">
                  <Button
                    variant={"default"}
                    size={"icon"}
                    className="hover:cursor-pointer"
                  >
                    <HiDotsVertical />
                  </Button>
                </div>
              </div>
            ))
          )}
        </SidebarContent>
      </SidebarGroup>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
};
