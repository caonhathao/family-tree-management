import Footer from "@/app/(public)/_components/footer";
import { HeaderServer } from "@/app/(public)/_components/header-server";

const HomeLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div
      className={
        "relative w-full min-h-screen flex flex-col gap-6 justify-center items-center"
      }
    >
      <HeaderServer />
      <div className={"flex-1 w-full flex gap-8"}>
        <main className={"flex-1"}>{children}</main>
      </div>
      <Footer />
    </div>
  );
};
export default HomeLayout;
