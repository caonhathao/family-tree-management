"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const features = [
  { slug: "build-flow", name: "Dựng sơ đồ" },
  { slug: "group-family", name: "Nhóm gia đình" },
  { slug: "storage", name: "Lưu trữ" },
  { slug: "events", name: "Sự kiện" },
];

export function FeatureMenu() {
  const router = useRouter();
  return (
    <nav
      className={
        "flex flex-col justify-start items-start gap-2 p-2 border-r-2 border-gray-200"
      }
    >
      <Button
        variant={"link"}
        className={"font-semibold text-lg hover:cursor-pointer px-0"}
        onClick={() => router.push("/features")}
      >
        Giới thiệu
      </Button>
      <p className={"font-semibold text-lg hover:cursor-default"}>
        Tính năng chính
      </p>
      <ul className={"pl-3"}>
        {features.map((feature) => (
          <motion.li
            key={feature.slug}
            whileHover={{
              scale: 1.05, // Nút to lên 5%
              x: 5, // Dịch sang phải 5px
              transition: { type: "spring", stiffness: 200, damping: 10 },
            }}
            whileTap={{ scale: 0.98 }} // Hiệu ứng lún xuống khi click
          >
            <Button
              variant={"ghost"}
              className={
                "hover:cursor-pointer w-full flex justify-start hover:bg-white hover:shadow-md hover:border transition-shadow duration-200"
              }
              onClick={() =>
                window.location.assign(`/features?part=${feature.slug}`)
              }
            >
              {feature.name}
            </Button>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
