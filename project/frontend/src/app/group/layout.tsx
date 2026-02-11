import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SideBarClient } from "./components/sidebar-client";
import { SideBarServer } from "./components/sidebar-server";
import { Separator } from "@/components/ui/separator";

const GroupLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="w-full max-h-screen">
      <SidebarProvider>
        <SideBarServer>
          {(groups) => <SideBarClient data={groups} />}
        </SideBarServer>
        <SidebarInset>
          <header className="flex min-h-12 items-center gap-2 border-b-2 px-4 py-1">
            <SidebarTrigger className="-ml-1 hover:cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="">Quản lý gia phả</div>
          </header>
          <main className="max-h-screen overflow-hidden">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};
export default GroupLayout;
