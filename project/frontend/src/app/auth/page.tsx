"use client";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosInformationCircleOutline } from "react-icons/io";
import { motion } from "framer-motion";
import { LoginForm } from "@/features/auth/_components/login-form";
import { SignupForm } from "@/features/auth/_components/signup-form";
import { useSearchParams } from "next/navigation";

const AuthPage = () => {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "login";
  const isLogin = mode === "login";
  return (
    <div className="w-full h-full flex flex-col justify-start items-center">
      {/* header with back and features buttons */}
      <div className="w-full flex flex-row justify-between items-center p-2">
        <Button
          variant={"outline"}
          size={"default"}
          className="flex flex-row gap-2 hover:cursor-pointer"
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
        <div className=" flex min-h-125 min-w-200 rounded-lg shadow-2xl">
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
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
