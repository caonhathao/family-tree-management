"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import logo from "../../../../../public/img/family-tree-logo.webp";
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
import NewGroupForm from "../forms/new-group-form";
import { cn } from "@/lib/utils";

const SidebarGroupClient = ({
  data,
}: {
  data: IResponseGroupFamiliesDto[];
}) => {
  const router = useRouter();
  const getColorFromName = (name: string) => {
    const avatarColors = [
      "var(--avatar-color-1)",
      "var(--avatar-color-2)",
      "var(--avatar-color-3)",
      "var(--avatar-color-4)",
      "var(--avatar-color-5)",
      "var(--avatar-color-6)",
    ];
    const charCodeSum = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[charCodeSum % avatarColors.length];
  };
  return (
    <Sidebar collapsible={"icon"} className={"bg-background"}>
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
                  className={
                    "text-sm font-bold group-data-[collapsible=icon]:hidden sm:text-base lg:text-lg"
                  }
                >
                  Xin chào
                </div>
                <IoIosArrowForward />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className={
                  "hover:cursor-pointer text-sm sm:text-base lg:text-lg gap-3"
                }
                onClick={() => router.push("/")}
              >
                <IoMdHome />
                Về trang chủ
              </DropdownMenuItem>
              <DropdownMenuItem
                className={
                  "hover:cursor-pointer text-sm sm:text-base lg:text-lg gap-3"
                }
                onClick={() => router.push("/tutorials")}
              >
                <MdOutlineContactSupport />
                Hướng dẫn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarGroup>
        <SidebarGroupLabel className={"text-xs sm:text-base lg:text-lg"}>
          Danh sách
        </SidebarGroupLabel>
        <SidebarContent>
          {data && data.length === 0 ? (
            <div
              className={
                "w-full flex flex-col justify-center items-center gap-3 group-data-[collapsible=icon]:hidden"
              }
            >
              <p className={"text-sm italic"}>(Trống)</p>
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
                    backgroundColor: `color-mix(in srgb, ${getColorFromName(item.name)} 12%, transparent)`,
                    color: getColorFromName(item.name),
                    borderColor: getColorFromName(item.name),
                  }}
                  className={
                    "size-7 lg:size-8 shrink-0 border rounded-lg font-bold flex items-center justify-center"
                  }
                >
                  {item.name[0]}
                </div>
                <div
                  className={
                    "text-sm group-data-[collapsible=icon]:hidden sm:text-base lg:text-lg"
                  }
                >
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
export default SidebarGroupClient;
