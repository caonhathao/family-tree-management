"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdArrowRoundUp } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { createScrollToTopVariants } from "@/configs/animation/hook.animi";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const variants = createScrollToTopVariants();

  // 1. Logic theo dõi vị trí cuộn trang
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 2. Logic cuộn về đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Cuộn mượt mà
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={"hidden"}
          animate={"visible"}
          exit={"hidden"}
          variants={variants}
          className={"fixed bottom-20 right-3 z-9999"}
        >
          <Button
            variant={"outline"}
            size={"icon"}
            className={
              "hover:cursor-pointer shadow-lg bg-white border hover:shadow-xl active:scale-[0.98]"
            }
            onClick={scrollToTop}
          >
            <IoMdArrowRoundUp />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default ScrollToTop;
