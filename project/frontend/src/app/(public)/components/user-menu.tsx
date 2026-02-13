"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import { IoPersonOutline } from "react-icons/io5";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/modules/auth/auth.actions";
import { Toaster } from "@/components/shared/toast";
import { AppDispatch, RootState } from "@/store";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { clearProfile } from "@/store/user/userSlice";
export const UserMenu = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);
  const handleLogOut = () => {
    startTransition(async () => {
      const result = await logoutAction();
      if (result?.error) {
        Toaster({
          title: "Đăng xuất thất bại",
          description: result.error,
          type: "error",
        });
      } else {
      }
      dispatch(clearProfile());
    });
  };
  //console.log(data);
  return (
    <div className={className}>
      <Avatar>
        <AvatarImage
          src={profile ? profile.userProfile.avatar : ""}
          alt={"@shadcn"}
          className={"grayscale"}
        />
        <AvatarFallback>
          <IoPersonOutline />
        </AvatarFallback>
      </Avatar>
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"outline"}
            size={"icon"}
            className={"hover:cursor-pointer"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <IoIosArrowDown />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        {profile ? (
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuItem className={"hover:cursor-pointer"}>
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem
                className={"hover:cursor-pointer"}
                onClick={() => router.push("/group")}
              >
                Nhóm
              </DropdownMenuItem>
              <DropdownMenuItem className={"hover:cursor-pointer"}>
                Cài đặt
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => handleLogOut()}
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/auth?mode=login")}
            >
              Đăng nhập
            </DropdownMenuItem>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/auth?mode=register")}
            >
              Đăng kí
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
};
