"use client";
import { IErrorResponse } from "@/types/base.types";
import { Navigation } from "./navigation-menu";
import { UserMenu } from "./user-menu";
import { IUserSession } from "@/types/auth.types";
import { ToggleThemeButton } from "@/components/custom/toggle-theme";

const HeaderClient = ({
  user,
}: {
  user: IUserSession | IErrorResponse | null;
}) => {
  return (
    <header
      className={
        "w-full px-3 py-2 flex flex-row justify-between items-center shadow-2xl"
      }
    >
      <Navigation className={"w-[60%] flex justify-start items-center gap-3"} />
      <div className={"w-fit flex flex-row justify-center items-center gap-2"}>
        <ToggleThemeButton />
        <UserMenu
          session={user}
          className={"flex flex-row gap-3 justify-end items-center"}
        />
      </div>
    </header>
  );
};
export default HeaderClient;
