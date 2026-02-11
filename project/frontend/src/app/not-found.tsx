"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { IoIosArrowBack, IoIosInformationCircleOutline } from "react-icons/io";
import Image from "next/image";
import notFound from "../../public/img/404.png";

const NotFoundPage = () => {
  const router = useRouter();
  const navigateBack = () => {
    router.back();
  };
  return (
    <div className={"w-screen flex flex-col gap-3 justify-start items-center"}>
      {/* header */}
      <div className={"w-full flex flex-row justify-between items-center p-2"}>
        <Button
          variant={"outline"}
          size={"default"}
          className={"flex flex-row gap-2 hover:cursor-pointer"}
          onClick={() => navigateBack()}
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
      <motion.div>
        <Image src={notFound} alt={"not-found-img"} />
      </motion.div>
    </div>
  );
};
export default NotFoundPage;
