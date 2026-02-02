import { getuserFromToken } from "@/lib/auth.lib";
import { ResponseGetUserDto } from "@/modules/user/user.dto";
import { cookies } from "next/headers";
import { UserMenu } from "./user-menu";
import { Navigation } from "./navigation-menu";

export async function HeaderServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  const user: ResponseGetUserDto | null = await getuserFromToken(token?.value);

  return (
    <header className="w-screen p-2 flex flex-row justify-between items-center">
      {/* logo web */}
      {/* navigation  menu */}
      <Navigation className="w-[60%] flex justify-center items-center" />
      {/* account menu */}
      <UserMenu
        user={user}
        className="w-[20%] flex flex-row gap-3 justify-center items-center"
      />
    </header>
  );
}
