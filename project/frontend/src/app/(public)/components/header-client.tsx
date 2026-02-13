import { ResponseGetUserDto } from "@/modules/user/user.dto";
import { IErrorResponse } from "@/types/base.types";
import { Navigation } from "./navigation-menu";
import { UserMenu } from "./user-menu";

const HeaderClient = ({
  user,
}: {
  user: ResponseGetUserDto | IErrorResponse | null;
}) => {
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
        data={user}
        className={"w-[40%] flex flex-row gap-3 justify-end items-center"}
      />
    </header>
  );
};
export default HeaderClient;
