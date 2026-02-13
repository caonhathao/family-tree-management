"use client";
import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { IErrorResponse } from "@/types/base.types";
import { Navigation } from "./navigation-menu";
import { UserMenu } from "./user-menu";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProfile } from "@/store/user/userSlice";

const HeaderClient = ({
  user,
}: {
  user: IResponseGetUserDto | IErrorResponse | null;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (user && "id" in user) {
      dispatch(setProfile(user));
    }
  }, [user, dispatch]);
  return (
    <header
      className={
        "w-full px-3 py-2 flex flex-row justify-between items-center shadow-2xl"
      }
    >
      {/* logo web and navigation  menu */}
      <Navigation className={"w-[60%] flex justify-start items-center gap-3"} />
      {/* account menu */}
      <UserMenu
        className={"w-[40%] flex flex-row gap-3 justify-end items-center"}
      />
    </header>
  );
};
export default HeaderClient;
