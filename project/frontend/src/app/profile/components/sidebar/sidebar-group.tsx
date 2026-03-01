"use client";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { dataProps } from "./sidebar-profile";
import { useRouter } from "next/navigation";

export const SidebarGroupContent = ({ data }: { data: dataProps }) => {
  const router = useRouter();
  if (!data) return;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{data.title}</SidebarGroupLabel>
      <SidebarMenu>
        {data.content.map((item, index) => (
          <SidebarMenuButton
            key={index}
            className={"hover:cursor-pointer"}
            onClick={() => router.push(item.url)}
          >
            <item.icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
