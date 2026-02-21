import FeatureMenu from "./components/feature-menu";

const FeaturesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={"w-screen h-full flex flex-row justify-between items-center"}
    >
      <div className={"w-[15%] h-full"}>
        <FeatureMenu />
      </div>
      <main className={" w-[85%] h-full"}>{children}</main>
    </div>
  );
};
export default FeaturesLayout;
