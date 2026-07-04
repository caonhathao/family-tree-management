import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FeatureMenu } from "./components/feature-menu";

const FeaturesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <FeatureMenu />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
};
export default FeaturesLayout;
