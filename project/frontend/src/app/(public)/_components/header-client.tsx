import { Navigation } from "./navigation-menu";
import { UserMenu } from "./user-menu";
import { IUserSession } from "@/types/auth.types";
import { ToggleThemeButton } from "@/components/custom/toggle-theme";
import { ApiResponse } from "@/types/api.types";
import { cn } from "@/lib/utils";

const HeaderClient = ({
  user,
}: {
  user: IUserSession | ApiResponse<IUserSession, unknown> | null;
}) => {
  return (
    <header
      className={cn(
        "w-screen lg:w-4/5 md:mx-auto fixed top-0 z-999 bg-background px-5 py-2 flex flex-row justify-between items-center drop-shadow-md drop-shadow-background",
        "border-b border-l border-r",
      )}
    >
      <Navigation />
      <div />
      <div className={"w-fit flex flex-row items-center gap-2"}>
        <ToggleThemeButton />
        <UserMenu
          session={user}
          className={"flex flex-row gap-3 items-center"}
        />
      </div>
    </header>
  );
};
export default HeaderClient;
