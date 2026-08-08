"use client";

import { cn } from "@/lib/utils";
import HomeSections from "./_components/sections/home-sections";

const HomePage = () => {
  return (
    <div
      className={cn(
        "w-full flex flex-col justify-center items-center gap-3 relative",
        "my-20 md:my-42",
      )}
    >
      <HomeSections />
    </div>
  );
};
export default HomePage;
