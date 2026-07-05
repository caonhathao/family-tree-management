import type { Variants } from "framer-motion";

// Hiệu ứng container xuất hiện tuần tự cho các phần tử con
// Container effect appears step-by-step for all child elements
export const staggerContainerVariants: Variants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const fadeInUpVariants: Variants = {
  offscreen: {
    y: 20,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      ease: "easeInOut",
      duration: 0.8,
    },
  },
};

export const HoverButtonVarians: Variants = {
  onHover: {
    scale: 1.1,
    transition: {
      ease: "easeIn",
      duration: 0.2,
    },
  },
  offHover: {
    scale: 1,
    transition: {
      ease: "easeOut",
      duration: 0.2,
    },
  },
};
