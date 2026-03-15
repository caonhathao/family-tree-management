import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebarServer } from "./_components/sidebar/admin-sidebar-server";
import { Separator } from "@/components/ui/separator";

const AdminLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className={"w-full min-h-screen flex flex-col gap-6 justify-start"}>
      <SidebarProvider>
        <AdminSidebarServer />
        <SidebarInset>
          <header
            className={"flex min-h-12 items-center gap-2 border-b-2 px-4 py-1"}
          >
            <SidebarTrigger className={"-ml-1 hover:cursor-pointer"} />
            <Separator orientation={"vertical"} className={"mr-2 h-4"} />
            <div className={""}>Quản lý - Hỗ trợ</div>
          </header>
          <main className={"max-h-screen overflow-hidden"}>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};
export default AdminLayout;
