import { Variants } from "framer-motion";

export const createScrollToTopVariants = ({
  distance = 20,
} = {}): Variants => ({
  hidden: {
    opacity: 0,
    y: distance,
    pointerEvents: "none", // Ngăn người dùng click khi đang ẩn
  },
  visible: {
    opacity: 1,
    y: 0,
    pointerEvents: "auto",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
});
