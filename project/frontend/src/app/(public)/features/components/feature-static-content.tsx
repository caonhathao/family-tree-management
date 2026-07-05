"use client";
import { scrollConfig } from "@/configs/animation/configs.anim";

import { motion } from "framer-motion";

import ScrollToTop from "../../_components/scroll-to-top-btn";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  fadeInUpVariants,
  staggerContainerVariants,
} from "@/configs/animation/variants.amin";

const FeatureStaticContent = () => {
  const router = useRouter();
  return (
    <div className={"w-full h-full flex flex-col justify-start items-start"}>
      <ScrollToTop />
      <motion.div
        variants={staggerContainerVariants}
        className={"font-semibold text-2xl"}
      >
        Giới thiệu
      </motion.div>
      <motion.div variants={staggerContainerVariants}>
        <p>Chào mừng bạn đến với trang khám phá tính năng.</p>
        <p>
          Dự án này này được ra đời nhằm mục đích số hóa gia phả gia đình, đồng
          thời giúp người dùng dễ dàng hình dung được thứ bậc của mình trong đại
          gia đình.
        </p>
        <p>
          Các tính năng hiện đang được mở rộng và phát triển, nhằm giúp người
          dùng đem lại trải nghiệm tốt nhất khi sử dụng dịch vụ.
        </p>
      </motion.div>
      <motion.div variants={fadeInUpVariants}>
        Các dịch vụ chính, bao gồm:
        <ul>
          <li>
            Dựng sơ đồ: Cho phép người dùng tự do tạo và kết nối người thân
            trong gia đình, nhằm tạo thành 1 cây phả hệ hoàn chỉnh với các cấp
            bậc và mối quan hệ rõ ràng.
            <Button
              variant={"link"}
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/features?part=build-flow")}
            >
              Xem thêm
            </Button>
          </li>
          <li>
            Nhóm gia đình: Cho phép người dùng tạo nhóm và mời thành viên tham
            gia.
            <Button
              variant={"link"}
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/features?part=group-family")}
            >
              Xem thêm
            </Button>
          </li>
          <li>
            Lưu trữ: Cho phép lưu trữ hình ảnh, video,.. của gia đình{" "}
            <strong className={"text-sm"}>(đang lên kế hoạch)</strong>
            <Button
              variant={"link"}
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/features?part=storage")}
            >
              Xem thêm
            </Button>
          </li>
          <li>
            Sự kiện: Hỗ trợ thông báo sự kiện gia đình,..
            <strong className={"text-sm"}>(đang lên kế hoạch)</strong>
            <Button
              variant={"link"}
              className={"hover:cursor-pointer"}
              onClick={() => router.push("/features?part=event")}
            >
              Xem thêm
            </Button>
          </li>
        </ul>
      </motion.div>
      <motion.div variants={fadeInUpVariants}>
        <p className={"text-sm"}>
          Dự án vẫn đang trong quá trình phát triển, vì vậy khó tránh khỏi sai
          sót, rất mong các bạn thông cảm.
        </p>
      </motion.div>
    </div>
  );
};

export default FeatureStaticContent;
