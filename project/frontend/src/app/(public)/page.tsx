"use client";

import HomeSections from "./_components/sections/home-sections";

const HomePage = () => {
  return (
    <div
      className={
        "w-full flex flex-col justify-center items-center gap-3 relative my-42"
      }
    >
      <HomeSections />
    </div>
  );
};
export default HomePage;
