import { Variants } from "framer-motion";

export const scrollConfig = { amount: 0.1, once: true };

export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(4px)",
  },
  visible: (custom: { delay?: number } = {}) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: custom?.delay ?? 0,
    },
  }),
  exit: {
    opacity: 0,
    y: 20,
    filter: "blur(4px)",
  },
};
