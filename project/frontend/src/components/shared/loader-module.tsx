"use client";

import { motion, Variants } from "framer-motion";

export const LoaderModule = ({
  scale = 1,
  className = "w-10 h-10",
}: {
  scale?: number;
  className?: string;
}) => {
  // Cấu hình cho vòng xoay chung
  const containerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Cấu hình cho từng dấu chấm (để chúng nhấp nháy hoặc thu phóng)
  const dotVariants = {
    animate: {
      scale: [scale, scale, scale],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={`flex items-center justify-center`}>
      <motion.div
        className={`relative ${className}`}
        variants={containerVariants as Variants}
        animate={"animate"}
      >
        {/* Dấu chấm 1 */}
        <motion.span
          variants={dotVariants as Variants}
          className={
            "absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full"
          }
        />
        {/* Dấu chấm 2 */}
        <motion.span
          variants={dotVariants as Variants}
          className={
            "absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full"
          }
        />
        {/* Dấu chấm 3 */}
        <motion.span
          variants={dotVariants as Variants}
          className={
            "absolute bottom-0 right-0 w-3 h-3 bg-amber-500 rounded-full"
          }
        />
      </motion.div>
    </div>
  );
};
