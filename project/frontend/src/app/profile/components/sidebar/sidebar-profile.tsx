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
import { SidebarGroupContent } from "./sidebar-group";
import { CiBoxList } from "react-icons/ci";
import { TiCloudStorageOutline } from "react-icons/ti";
import { IconType } from "react-icons";
import { BiSupport } from "react-icons/bi";
import { useRouter } from "next/navigation";

export interface dataProps {
  title: string;
  content: {
    icon: IconType;
    title: string;
    url: string;
  }[];
}
const data: Record<string, dataProps> = {
  genetal: {
    title: "Chung",
    content: [
      { icon: IoPersonOutline, title: "Thông tin cá nhân", url: "/profile" },
      { icon: RiLockPasswordLine, title: "Bảo mật", url: "/security" },
    ],
  } as dataProps,
  group: {
    title: "Nhóm",
    content: [
      {
        icon: MdOutlinePeopleAlt,
        title: "Danh sách",
        url: "/group",
      },
      {
        icon: CiBoxList,
        title: "Lời mời",
        url: "/invite-list",
      },
    ],
  },
  storage: {
    title: "Lưu trữ",
    content: [
      {
        icon: TiCloudStorageOutline,
        title: "Kho lưu trữ",
        url: "/storage",
      },
      {
        icon: RiDeleteBin2Line,
        title: "Thùng rác",
        url: "/trash",
      },
    ],
  },
  support: {
    title: "Hỗ trợ",
    content: [
      {
        icon: BiSupport,
        title: "Hỗ trợ",
        url: "/support",
      },
      {
        icon: MdOutlineFeedback,
        title: "Phản hồi",
        url: "/feadback",
      },
    ],
  },
};

export const SideBarProfile = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  return (
    <Sidebar collapsible={"icon"}>
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
                      className={"grayscale"}
                    />
                    <AvatarFallback>
                      <IoPersonOutline />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div
                  className={"font-bold group-data-[collapsible=icon]:hidden"}
                >
                  Xin chào,
                  {profile && profile.id !== ""
                    ? profile.userProfile.fullName
                    : "bạn"}
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
      <SidebarGroupContent data={data.genetal} />
      <SidebarGroupContent data={data.group} />
      <SidebarGroupContent data={data.storage} />
      <SidebarGroupContent data={data.support} />
    </Sidebar>
  );
};
