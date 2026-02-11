"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import logo from "../../../../public/img/family-tree-logo.png";
export const Navigation = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <div className={"relative w-12 h-12 overflow-hidden rounded-full border"}>
        {" "}
        <Image
          src={logo}
          fill
          sizes={"48px"}
          alt={"logo"}
          className={"object-cover object-center"}
        />
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href={"/"}
            >
              Giới thiệu
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href={"/features"}
            >
              Tính năng
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href={"/tutorials"}
            >
              Hướng dẫn
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href={"/feedback"}
            >
              Phản hồi
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
