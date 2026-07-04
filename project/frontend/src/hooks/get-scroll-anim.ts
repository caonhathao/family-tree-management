interface ScrollAnimationConfig {
  once?: boolean;
  amount?: number | "some" | "all";
  delay?: number;
}

interface UseScrollAnimationOptions {
  direction?: "up" | "down" | "left" | "right";
  config?: ScrollAnimationConfig;
}

export const getScrollAnimation = ({
  direction = "left",
  config = {},
}: UseScrollAnimationOptions = {}) => {
  const { once = true, amount = 0.5, delay = 0 } = config;

  return {
    initial: "hidden",
    whileInView: "visible",
    exit: "exit",
    viewport: {
      once,
      amount,
    },
    custom: { direction, delay },
  };
};
