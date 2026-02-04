import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosInformationCircleOutline } from "react-icons/io";
import { motion } from "framer-motion";
import { LoginForm } from "@/app/auth/components/login-form";
import { SignupForm } from "@/app/auth/components/signup-form";
import { useRouter, useSearchParams } from "next/navigation";
import { createSlideVariants, scrollConfig } from "@/configs/animation.config";

const AuthContent = () => {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "login";
  const isLogin = mode === "login";

  const router = useRouter();

  const navigateToHome = () => {
    router.push("/");
  };

  const variantSlideAnimation = createSlideVariants();

  return (
    <div className="w-full h-full flex flex-col justify-start items-center">
      {/* header with back and features buttons */}
      <div className="w-full flex flex-row justify-between items-center p-2">
        <Button
          variant={"outline"}
          size={"default"}
          className="flex flex-row gap-2 hover:cursor-pointer"
          onClick={() => navigateToHome()}
        >
          <IoIosArrowBack />
          Quay lại
        </Button>
        <Button
          variant={"outline"}
          size={"icon"}
          className="hover:cursor-pointer"
        >
          <IoIosInformationCircleOutline />
        </Button>
      </div>
      <div className="w-[80%] flex justify-center items-center">
        {/* main container */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          exit={"exit"}
          viewport={{
            once: scrollConfig.once,
            amount: scrollConfig.amount,
          }}
          custom={{ direction: "right", delay: 0.2 }}
          variants={variantSlideAnimation}
          className=" flex min-h-125 min-w-200 rounded-lg shadow-2xl"
        >
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            className={`w-full flex ${isLogin ? "flex-row" : "flex-row-reverse"} justify-center items-center gap-3`}
          >
            {/* be default, sign form will be in the left side of container */}
            <div className="w-1/2">
              {isLogin ? <LoginForm /> : <SignupForm />}
            </div>
            <motion.div
              layout
              className={`flex w-1/2 h-full flex-col items-center justify-center ${isLogin ? "bg-blue-500 text-white p-10 rounded-br-lg rounded-tr-lg" : "bg-amber-500 text-white p-10 rounded-bl-lg rounded-tl-lg"}`}
            >
              <h2 className="text-2xl font-bold">Chào bạn!</h2>
              <p className="text-center mt-2">
                {isLogin
                  ? "Nhập thông tin để tiếp tục"
                  : "Bắt đầu hành trình mới cùng chúng tôi"}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default AuthContent;
