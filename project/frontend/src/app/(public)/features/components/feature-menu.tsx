"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { FaDrawPolygon } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { RiArrowDropRightLine } from "react-icons/ri";
import { TiCloudStorageOutline } from "react-icons/ti";
import { GrGroup } from "react-icons/gr";

const features = [
  { slug: "build-flow", name: "Dựng sơ đồ", Icon: FaDrawPolygon },
  { slug: "group-family", name: "Nhóm gia đình", Icon: GrGroup },
  { slug: "storage", name: "Lưu trữ", Icon: TiCloudStorageOutline },
  { slug: "events", name: "Sự kiện", Icon: MdEventAvailable },
];

export function FeatureMenu() {
  const router = useRouter();
  return (
    <Sidebar className={"bg-background"}>
      <SidebarHeader className={"bg-background font-bold"}>
        Danh mục
      </SidebarHeader>
      <SidebarContent className={"bg-background"}>
        <SidebarGroup>
          <SidebarGroupLabel>Chung</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push("/features")}>
                <RiArrowDropRightLine />
                Giới thiệu
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tính năng chính</SidebarGroupLabel>
          <SidebarMenu>
            {features.map((item, index) => (
              <SidebarMenuItem key={`feature-menu-item-${index}`}>
                <SidebarMenuButton
                  onClick={() =>
                    window.location.assign(`/features?part=${item.slug}`)
                  }
                >
                  <item.Icon />
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
