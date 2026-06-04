"use client";
import { motion, Variants } from "framer-motion";
interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}

export const ScrollSection = ({
  children,
  className,
  variants,
}: ScrollSectionProps) => {
  return (
    <motion.section
      initial={"hidden"}
      whileInView={"visible"}
      exit={"exit"}
      // viewport={{
      //   once: scrollConfig.once,
      //   amount: scrollConfig.amount,
      // }}
      variants={variants}
      className={className}
      transition={{
        delay: 2,
      }}
    >
      {children}
    </motion.section>
  );
};
