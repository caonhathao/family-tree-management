"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
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
import NewGroupForm from "./forms/new-group-form";
import { cn } from "@/lib/util/utils";

export const SideBarClient = ({
  data,
}: {
  data: IResponseGroupFamiliesDto[];
}) => {
  const router = useRouter();
  const getColorFromName = (name: string) => {
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
    ];
    // Tính tổng mã ASCII của các ký tự trong tên
    const charCodeSum = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };
  return (
    <Sidebar collapsible={"icon"}>
      <SidebarHeader className={"flex flex-row justify-between items-center"}>
        <SidebarMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size={"lg"}
                className={
                  "min-h-12 hover:cursor-pointer w-full flex flex-row justify-between items-center"
                }
              >
                <div
                  className={
                    "flex aspect-square size-8 items-center justify-center rounded-lg shrink-0"
                  }
                >
                  <Image
                    src={logo.src}
                    width={2000}
                    height={2000}
                    alt={"logo"}
                    className={"rounded-lg w-10 border-2"}
                  />
                </div>
                <div
                  className={"font-bold group-data-[collapsible=icon]:hidden"}
                >
                  Nhóm của bạn
                </div>
                <IoIosArrowForward />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className={"hover:cursor-pointer"}
                onClick={() => router.push("/")}
              >
                <IoMdHome />
                Về trang chủ
              </DropdownMenuItem>
              <DropdownMenuItem
                className={"hover:cursor-pointer"}
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
            <div
              className={
                "w-full flex flex-col justify-center items-center gap-3 group-data-[collapsible=icon]:hidden"
              }
            >
              <p className={"italic"}>Không có nhóm nào</p>
            </div>
          ) : (
            data.map((item, index) => (
              <SidebarMenuButton
                key={index}
                className={cn(
                  "w-full h-fit p-0 justify-start items-center gap-2 hover:cursor-pointer",
                  // Khi thu nhỏ: bỏ padding mặc định, ép căn giữa tuyệt đối
                  "group-data-[state=collapsed]:p-0! group-data-[state=collapsed]:justify-center",
                )}
                onClick={() => router.push(`/group?groupId=${item.id}`)}
              >
                <div
                  style={{
                    backgroundColor: getColorFromName(item.name) + "20",
                    color: getColorFromName(item.name),
                    borderColor: getColorFromName(item.name),
                  }}
                  className={
                    "size-7 shrink-0 border rounded-lg font-bold flex items-center justify-center"
                  }
                >
                  {item.name[0]}
                </div>
                <div className={"group-data-[collapsible=icon]:hidden"}>
                  {item.name}
                </div>
              </SidebarMenuButton>
            ))
          )}
          <NewGroupForm className={"group-data-[collapsible=icon]:hidden"} />
        </SidebarContent>
      </SidebarGroup>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
};
