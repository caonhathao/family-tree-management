import { Variants } from "framer-motion";

export const fadeVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.5 },
  },
};

export const scrollConfig = {
  amount: 0.6, // Scroll đến 30% section thì mới hiện
  once: false, // true: chỉ hiện 1 lần; false: scroll lên/xuống đều chạy lại hiệu ứng
};

interface AnimationProps {
  distance?: number;
  blur?: number;
  duration?: number;
  delay?: number;
}

export const createSlideVariants = ({
  distance = 20,
  blur = 5,
  duration = 0.5,
}: AnimationProps = {}): Variants => ({
  hidden: (custom: { direction: "left" | "right" }) => ({
    opacity: 0,
    x: custom.direction === "left" ? -distance : distance,
    filter: `blur(${blur}px)`,
  }),
  visible: (custom: { delay: number }) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration,
      delay: custom.delay || 0, // Lấy delay từ custom
      ease: "easeOut",
    },
  }),
  exit: (custom: { direction: "left" | "right" }) => ({
    opacity: 0,
    x: custom.direction === "left" ? -distance : distance,
    transition: { duration },
  }),
});

export const createListContainerVariants = ({
  duration = 0.5,
}: AnimationProps = {}): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: duration,
      ease: "easeOut",
    },
  },
});

export const createListItemVariants = ({
  distance = 30, // Tăng khoảng cách trượt một chút để thấy rõ chuyển động
  blur = 10,
}: AnimationProps = {}): Variants => ({
  hidden: (custom: { direction: "left" | "right" }) => ({
    opacity: 0,
    x: custom.direction === "left" ? -distance : distance,
    filter: `blur(${blur}px)`,
    scale: 0.95, // Thêm scale nhẹ để hiệu ứng "mọc" ra mượt hơn
  }),
  visible: (custom: { delay: number }) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100, // Giảm stiffness để chuyển động mềm mại hơn
      damping: 15, // Damping vừa phải để không bị rung quá nhiều
      delay: custom.delay || 0,
      mass: 0.8, // Thêm khối lượng để cảm giác chuyển động có trọng lượng
    },
  }),
  exit: (custom: { direction: "left" | "right" }) => ({
    opacity: 0,
    x: custom.direction === "left" ? -distance : distance,
    filter: `blur(${blur}px)`,
    scale: 0.95,
    transition: { duration: 0.3 },
  }),
});

export const createScrollToTopVariants = ({
  distance = 20,
  duration = 0.4,
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
