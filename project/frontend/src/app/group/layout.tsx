import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SidebarGroupClient from "./_components/sidebar/sidebar-group-client";
import { SidebarGroupServer } from "./_components/sidebar/sidebar-group-server";
import { Separator } from "@/components/ui/separator";

const GroupLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className={"w-full h-full"}>
      <SidebarProvider>
        <SidebarGroupServer>
          {(groups) => <SidebarGroupClient data={groups} />}
        </SidebarGroupServer>
        <SidebarInset>
          <header
            className={"flex min-h-12 items-center gap-2 border-b-2 px-4 py-1"}
          >
            <SidebarTrigger className={"-ml-1 hover:cursor-pointer"} />
            <Separator orientation={"vertical"} className={"mr-2 h-4"} />
            <h2 className={"lg:text-xl"}>Quản lý gia phả</h2>
          </header>
          <main className={"max-h-screen overflow-hidden"}>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};
export default GroupLayout;
