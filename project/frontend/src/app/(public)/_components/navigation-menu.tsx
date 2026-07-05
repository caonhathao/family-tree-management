"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import logo from "../../../../public/img/family-tree-logo.webp";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Button } from "@/components/ui/button";
export const Navigation = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div className={"w-fit flex flex-fow justify-center items-center gap-2"}>
      <div
        className={
          "relative w-12 h-12 overflow-hidden rounded-full border hover:cursor-pointer"
        }
        onClick={() => router.push("/")}
      >
        <Image
          src={logo}
          fill
          sizes={"48px"}
          alt={"logo"}
          className={"object-cover object-center"}
        />
      </div>
      <h2
        className={
          "text-2xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent"
        }
      >
        MYFA
      </h2>

      {/* display on desktop devices */}
      <div className={"hidden md:block"}>
        <NavigationMenu aria-label={"navigate menu"}>
          <NavigationMenuList>
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
                href={"/faq"}
              >
                FAQ
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* display on mobile */}
      <div className={"relative md:hidden"}>
        <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
          <DropdownMenuTrigger
            id={"navigate-dropdown-menu"}
            className={"md:hidden"}
            aria-label={"navigate menu"}
            asChild
          >
            <Button size={"icon-lg"} variant={"outline"}>
              <MdOutlineKeyboardArrowDown
                size={20}
                className={`inline-block ${isOpen ? "animate-rotate-up" : "animate-rotate-down"}`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={"w-40 z-999"} align={"start"}>
            <DropdownMenuGroup className={"flex flex-col"}>
              <DropdownMenuItem
                className={""}
                onClick={() => router.push("/features")}
              >
                Tính năng
              </DropdownMenuItem>
              <DropdownMenuItem
                className={""}
                onClick={() => router.push("/features")}
              >
                Hướng dẫn
              </DropdownMenuItem>
              <DropdownMenuItem
                className={""}
                onClick={() => router.push("/features")}
              >
                FAQ
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
