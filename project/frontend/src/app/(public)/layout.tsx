import Footer from "@/components/group/public/footer";
import { HeaderServer } from "@/components/group/public/header-server";

const HomeLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="w-full h-screen flex flex-col gap-6 justify-start items-center">
      <HeaderServer />
      {children}
      <Footer />
    </div>
  );
};
export default HomeLayout;
