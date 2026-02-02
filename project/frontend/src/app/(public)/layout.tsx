import { HeaderServer } from "@/components/group/public/header-server";

const HomeLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="w-screen h-screen flex flex-col gap-3 justify-start items-center">
      <HeaderServer />
      {children}
    </div>
  );
};
export default HomeLayout;
