"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { IoIosArrowForward, IoMdHome } from "react-icons/io";
import { MdOutlineFeedback, MdOutlinePeopleAlt } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IoPersonOutline } from "react-icons/io5";
import { RiDeleteBin2Line, RiLockPasswordLine } from "react-icons/ri";
import { CiBoxList } from "react-icons/ci";
import { TiCloudStorageOutline } from "react-icons/ti";
import { BiSupport } from "react-icons/bi";
import { useRouter } from "next/navigation";
import { dataProps } from "@/types/base.types";
import { SidebarGroupContent } from "@/components/custom/sidebar-group";

const data: Record<string, dataProps> = {
  general: {
    title: "Chung",
    content: [
      {
        icon: IoPersonOutline,
        title: "Thông tin cá nhân",
        url: "/user/profile",
      },
      { icon: RiLockPasswordLine, title: "Bảo mật", url: "/user/secure" },
    ],
  },
  group: {
    title: "Nhóm",
    content: [
      {
        icon: MdOutlinePeopleAlt,
        title: "Danh sách",
        url: "/user/groups",
      },
      {
        icon: CiBoxList,
        title: "Lời mời",
        url: "/user/invite-list",
      },
    ],
  },
  storage: {
    title: "Lưu trữ",
    content: [
      {
        icon: TiCloudStorageOutline,
        title: "Kho lưu trữ",
        url: "/user/storage",
      },
      {
        icon: RiDeleteBin2Line,
        title: "Thùng rác",
        url: "/user/trash",
      },
    ],
  },
  support: {
    title: "Hỗ trợ",
    content: [
      {
        icon: BiSupport,
        title: "Hỗ trợ",
        url: "/user/support",
      },
      {
        icon: MdOutlineFeedback,
        title: "Phản hồi",
        url: "/user/feadback",
      },
    ],
  },
};

export const SideBarProfile = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  return (
    <Sidebar collapsible={"icon"} className={"bg-background"}>
      <SidebarHeader>
        <SidebarMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size={"lg"}
                className={
                  "min-h-12 hover:cursor-pointer hover:border-2 hover:shadow-lg w-full flex flex-row justify-between items-center"
                }
              >
                <div
                  className={
                    "flex aspect-square size-8 items-center justify-center rounded-lg shrink-0"
                  }
                >
                  <Avatar>
                    <AvatarImage
                      src={
                        profile && profile.id !== ""
                          ? profile.userProfile.avatar
                          : ""
                      }
                      alt={"@shadcn"}
                      className={""}
                    />
                    <AvatarFallback>
                      <IoPersonOutline />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div
                  className={"font-bold group-data-[collapsible=icon]:hidden"}
                >
                  Xin chào
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
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarGroupContent data={data.general} />
      <SidebarGroupContent data={data.group} />
      <SidebarGroupContent data={data.storage} />
      <SidebarGroupContent data={data.support} />
    </Sidebar>
  );
};
