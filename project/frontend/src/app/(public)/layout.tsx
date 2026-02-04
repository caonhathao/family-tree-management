import Footer from "@/app/(public)/components/footer";
import { HeaderServer } from "@/app/(public)/components/header-server";

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
