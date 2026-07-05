import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import FeatureMenu from "./components/feature-menu";

const FeaturesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={"[--header-height:calc(--spacing(20))]"}>
      <SidebarProvider className={"flex flex-col"}>
        <div className={"flex flex-1"}>
          <FeatureMenu />
          <main className={"mt-(--header-height)"}>
            <SidebarTrigger />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};
export default FeaturesLayout;
