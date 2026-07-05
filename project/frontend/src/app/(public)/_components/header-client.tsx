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
        "w-full md:w-4/5 md:mx-auto fixed top-0 z-999 bg-background px-3 py-2 flex flex-row justify-between items-center shadow-2xl"
      }
    >
      <Navigation />
      <div
        className={
          "relative w-fit flex flex-row justify-center items-center gap-2"
        }
      >
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
