"use client";

import HomeSections from "./components/sections/home-sections";

const HomePage = () => {
  return (
    <div
      className={
        "w-full flex flex-col justify-center items-center gap-3 relative"
      }
    >
      <p className={"text-text-default font-bold text-2xl"}>MYFA</p>
      <HomeSections />
    </div>
  );
};
export default HomePage;
