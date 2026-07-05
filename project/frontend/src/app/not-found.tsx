"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { IoIosArrowBack, IoIosInformationCircleOutline } from "react-icons/io";
import Image from "next/image";
import notFound from "../../public/img/not-found.webp";
import { navigateTo } from "@/lib/utils/navigate.utils";
import {
  fadeInUpVariants,
  staggerContainerVariants,
} from "@/configs/animation/variants.amin";

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div className={"w-screen flex flex-col gap-3 justify-start items-center"}>
      {/* header */}
      <div className={"w-full flex flex-row justify-between items-center p-2"}>
        <Button
          variant={"outline"}
          size={"default"}
          className={"flex flex-row gap-2 hover:cursor-pointer"}
          onClick={() =>
            navigateTo({
              router: router,
              action: () => router.back(),
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
      {/* notification */}
      <motion.div
        variants={staggerContainerVariants}
        initial={"offscreen"}
        whileInView={"onscreen"}
        viewport={{
          once: true,
          amount: 0.2,
        }}
      >
        <motion.div
          variants={fadeInUpVariants}
          className={"w-screen h-screen flex justify-center items-center"}
        >
          <Image
            src={notFound}
            alt={"not-found-img"}
            sizes={"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
export default NotFoundPage;
