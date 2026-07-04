import type { Variants } from "framer-motion";

// Hiệu ứng container xuất hiện tuần tự cho các phần tử con
export const staggerContainerVariants: Variants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Hiệu ứng đi từ dưới lên (Fade In Up)
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
