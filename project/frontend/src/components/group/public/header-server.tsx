import { getuserFromToken } from "@/lib/auth.lib";
import { ResponseGetUserDto } from "@/modules/user/user.dto";
import { cookies } from "next/headers";
import { UserMenu } from "./user-menu";
import { Navigation } from "./navigation-menu";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  const user: ResponseGetUserDto | null = await getuserFromToken(token?.value);
  console.log(user);

  return (
    <header className="w-full px-3 py-2 flex flex-row justify-between items-center shadow-2xl">
      {/* logo web and navigation  menu */}
      <Navigation className="w-[60%] flex justify-start items-center gap-3" />
      {/* account menu */}
      <UserMenu
        user={user}
        className="w-[40%] flex flex-row gap-3 justify-end items-center"
      />
    </header>
  );
}
