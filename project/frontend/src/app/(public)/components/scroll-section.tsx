"use client";
import { motion, Variants } from "framer-motion";
import { fadeVariants, scrollConfig } from "@/configs/animation.config";

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollSection = ({ children, className }: ScrollSectionProps) => {
  return (
    <motion.section
      initial={"hidden"}
      whileInView={"visible"}
      exit={"exit"}
      viewport={{
        once: scrollConfig.once,
        amount: scrollConfig.amount,
      }}
      variants={fadeVariants as Variants}
      className={className}
    >
      {children}
    </motion.section>
  );
};
