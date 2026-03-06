"use client";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { IUserSession } from "@/types/auth.types";
import { dataProps, IErrorResponse } from "@/types/base.types";
import { useMemo } from "react";
import { IoIosArrowForward, IoMdHome } from "react-icons/io";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IoPersonOutline } from "react-icons/io5";
import unknow from "../../../../../public/img/unknow.png";
import { BiSupport } from "react-icons/bi";
import { CiBoxList } from "react-icons/ci";
import { RiQuillPenAiLine } from "react-icons/ri";
import { VscFeedback } from "react-icons/vsc";
import { SidebarGroupContent } from "@/components/custom/sidebar-group";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { useRouter } from "next/navigation";

const data: Record<string, dataProps> = {
  general: {
    title: "Tổng quan",
    content: [
      { icon: MdOutlineSpaceDashboard, title: "Tổng quan", url: "/admin" },
    ],
  },
  user: {
    title: "Người dùng",
    content: [
      {
        icon: CiBoxList,
        title: "Danh sách",
        url: "/admin/users",
      },
      {
        icon: VscFeedback,
        title: "Phản hồi",
        url: "/admin/user_feedbacks",
      },
    ],
  },
  blog: {
    title: "Bài viết",
    content: [
      {
        icon: RiQuillPenAiLine,
        title: "Soạn thảo",
        url: "/admin/blog_draft",
      },
      {
        icon: CiBoxList,
        title: "Danh sách",
        url: "/admin/blogs",
      },
    ],
  },
  support: {
    title: "Hỗ trợ",
    content: [
      {
        icon: BiSupport,
        title: "Hỗ trợ",
        url: "/admin/supports",
      },
    ],
  },
};

export const AdminSidebarClient = ({
  session,
}: {
  session: IUserSession | IErrorResponse | null;
}) => {
  const router = useRouter();
  const isLogin = !!session && !("error" in session);

  const avatar = useMemo(() => {
    if (isLogin && session.avatar) {
      return session.avatar;
    }
    return unknow.src;
  }, [session, isLogin]);

  const name = useMemo(() => {
    if (isLogin && session.fullName) {
      return session.fullName;
    }
    return "admin";
  }, [session, isLogin]);

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
                      src={avatar}
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
                  {name}
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
      <SidebarGroupContent data={data.user} />
      <SidebarGroupContent data={data.blog} />
      <SidebarGroupContent data={data.support} />
    </Sidebar>
  );
};
