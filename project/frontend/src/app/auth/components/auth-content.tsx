"use client";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosInformationCircleOutline } from "react-icons/io";
import { motion } from "framer-motion";
import { LoginForm } from "@/app/auth/components/login-form";
import { SignupForm } from "@/app/auth/components/signup-form";
import { useRouter, useSearchParams } from "next/navigation";

import { navigateTo } from "@/lib/utils/navigate.utils";
import {
  fadeInUpVariants,
  staggerContainerVariants,
} from "@/configs/animation/variants.amin";

const AuthContent = () => {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "login";
  const callBack = searchParams.get("callbackUrl") || "/";
  const isLogin = mode === "login";

  const router = useRouter();

  return (
    <div className={"w-full h-full flex flex-col justify-between items-center"}>
      {/* header with back and features buttons */}
      <div
        className={"w-full h-20 flex flex-row justify-between items-center p-2"}
      >
        <Button
          variant={"outline"}
          size={"default"}
          className={"flex flex-row gap-2 hover:cursor-pointer"}
          onClick={() =>
            navigateTo({
              router: router,
              action: () => router.push("/"),
            })
          }
        >
          <IoIosArrowBack />
          Quay lại
        </Button>
        <Button
          variant={"outline"}
          size={"icon"}
          className={"hover:cursor-pointer"}
        >
          <IoIosInformationCircleOutline />
        </Button>
      </div>
      <div className={"w-full h-full flex justify-center items-center"}>
        {/* main container */}
        <div
          className={`flex min-h-125 w-full shadow-2xl border ${isLogin ? "border-primary/30" : "border-secondary/30"}`}
        >
          <motion.div
            variants={staggerContainerVariants}
            initial={"offscreen"}
            whileInView={"onscreen"}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            className={`w-full flex ${isLogin ? "flex-col" : "flex-col"} justify-center items-center gap-3`}
          >
            <motion.div
              variants={fadeInUpVariants}
              className={`flex w-full h-full flex-col items-center justify-center ${isLogin ? "bg-primary text-primary-foreground p-10 rounded-lg" : "bg-secondary text-secondary-foreground p-10 rounded-bl-lg rounded-tl-lg"}`}
            >
              <h2 className={"text-2xl font-bold"}>Chào bạn!</h2>
              <p className={"text-center mt-2"}>
                {isLogin
                  ? "Nhập thông tin để tiếp tục"
                  : "Bắt đầu hành trình mới cùng chúng tôi"}
              </p>
            </motion.div>
            <motion.div className={"w-full"} variants={fadeInUpVariants}>
              {isLogin ? (
                <LoginForm callback={decodeURIComponent(callBack)} />
              ) : (
                <SignupForm />
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
export default AuthContent;
