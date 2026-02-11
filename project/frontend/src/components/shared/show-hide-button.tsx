import { motion } from "framer-motion";
import { Button } from "../ui/button";

interface ShowHideButtonProps {
  isPasswordVisible: boolean;
  setIsPasswordVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ShowHideButton = ({
  isPasswordVisible,
  setIsPasswordVisible,
}: ShowHideButtonProps) => {
  return (
    <Button
      type={"button"}
      variant={"outline"}
      size={"icon"}
      className={"hover:cursor-pointer"}
      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
    >
      <motion.div
        initial={false}
        animate={isPasswordVisible ? "visible" : "hidden"}
      >
        <svg
          xmlns={"http://www.w3.org/2000/svg"}
          width={"20"}
          height={"20"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          strokeWidth={"2"}
          strokeLinecap={"round"}
          strokeLinejoin={"round"}
          className={"lucide lucide-eye"}
        >
          {/* Hình con mắt cố định */}
          <path d={"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"} />
          <circle cx={"12"} cy={"12"} r={"3"} />

          {/* Đường gạch chéo Animation */}
          <motion.path
            initial={false}
            animate={isPasswordVisible ? "visible" : "hidden"}
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: { pathLength: 1, opacity: 1 },
            }}
            transition={{ duration: 0.3 }}
            d={"M3 3l18 18"}
          />
        </svg>
      </motion.div>
    </Button>
  );
};
