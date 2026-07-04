const InviteLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className={"w-full h-full"}>
      <main className={"max-h-screen overflow-hidden"}>{children}</main>
    </div>
  );
};
export default InviteLayout;
