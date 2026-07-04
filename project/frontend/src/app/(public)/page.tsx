"use client";
import { ScrollSection } from "@/app/(public)/components/scroll-section";
import Image from "next/image";
import logo from "../../../public/img/family-tree-logo.png";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollToTop from "@/app/(public)/components/scroll-to-top-btn";
import { navigateTo } from "@/lib/utils/navigate.utils";
import { useRouter } from "next/navigation";
import { scrollConfig } from "@/configs/animation/configs.anim";
import { getScrollAnimation } from "@/hooks/get-scroll-anim";
import {
  createSlideVariants,
  createListContainerVariants,
  createListItemVariants,
} from "@/configs/animation/hook.animi";
const HomePage = () => {
  const router = useRouter();
  const variantSlideAnimation = createSlideVariants();
  const variantListContainerAnim = createListContainerVariants();
  const variantListItemAnim = createListItemVariants();

  const features = [
    "Sơ đồ gia phả thông minh, trực quan.",
    "Số hóa tiểu sử và ký ức dòng họ.",
    "Lưu trữ hình ảnh,video gia đình",
    "Tự động nhắc nhở ngày giỗ, ngày lễ.",
    "Bảo mật và phân quyền riêng tư tuyệt đối.",
  ];
  return (
    <div
      className={
        "w-full flex flex-col justify-center items-center gap-3 relative"
      }
    >
      <ScrollToTop />
      <ScrollSection
        className={
          "h-[80vh] w-[75%] bg-section-1 flex flex-row items-center justify-between gap-3 rounded-lg shadow-2xl p-3"
        }
      >
        <motion.div
          {...getScrollAnimation({ direction: "left", config: scrollConfig })}
          variants={variantSlideAnimation}
          className={"w-[40%] p-2"}
        >
          <Image
            loading={"eager"}
            src={logo.src}
            width={2000}
            height={2000}
            alt={"logo"}
            className={"w-full rounded-lg shadow-2xl"}
          />
        </motion.div>
        <div
          className={"w-[60%] gap-3 flex flex-col justify-center items-center"}
        >
          <motion.p
            {...getScrollAnimation({
              direction: "right",
              config: scrollConfig,
            })}
            variants={variantSlideAnimation}
            className={"text-2xl font-semibold"}
          >
            Gìn giữ hồn cốt gia đình – Nối dài sợi dây huyết thống
          </motion.p>
          <motion.p
            {...getScrollAnimation({
              direction: "right",
              config: scrollConfig,
            })}
            className={"p-3"}
          >
            Gia đình không chỉ là hiện tại, mà còn là một dòng chảy bất tận từ
            quá khứ đến tương lai. Hệ thống của chúng tôi không chỉ là một công
            cụ quản lý, mà là nơi lưu giữ những câu chuyện, những gương mặt và
            những giá trị đạo đức mà ông cha đã dày công xây dựng. Với giao diện
            trực quan và thân thiện với người dùng, chúng tôi giúp bạn kiến tạo
            một cuốn &apos;gia phả số&apos; sống động, để thế hệ mai sau luôn
            biết mình đến từ đâu.
          </motion.p>
          <div className={"italic w-full flex flex-col justify-end items-end"}>
            <motion.p
              {...getScrollAnimation({
                direction: "right",
                config: scrollConfig,
              })}
              className={"text-center px-3"}
            >
              &quot;Các vua Hùng đã có công dựng nước <br /> Bác cháu ta phải
              cùng nhau giữ lấy nước&quot;
            </motion.p>
            <motion.p
              {...getScrollAnimation({
                direction: "right",
                config: scrollConfig,
              })}
              className={"px-3"}
            >
              Bác Hồ
            </motion.p>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection
        variants={variantListContainerAnim}
        className={
          "h-[80vh] w-[75%] bg-section-2 flex flex-row-reverse items-center justify-between gap-3 rounded-lg shadow-2xl p-3"
        }
      >
        <motion.div
          {...getScrollAnimation({ direction: "right", config: scrollConfig })}
          variants={variantSlideAnimation}
          className={"w-[40%] p-2"}
        >
          <Image
            loading={"eager"}
            src={logo.src}
            width={2000}
            height={2000}
            alt={"logo"}
            className={"w-full rounded-lg shadow-2xl"}
          />
        </motion.div>
        <div
          className={
            "w-[60%] p-2 gap-3 flex flex-col justify-center items-start"
          }
        >
          <motion.p
            {...getScrollAnimation({ direction: "left", config: scrollConfig })}
            className={"text-2xl font-semibold"}
          >
            Cách chúng tôi giúp bạn kết nối cội nguồn
          </motion.p>
          <div className={"px-10"}>
            <motion.ol
              {...getScrollAnimation({
                direction: "left",
                config: scrollConfig,
              })}
              className={"list-decimal list-inside space-y-4 text-lg"}
            >
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  custom={{ directtion: "left", delay: index * 0.1 }}
                  variants={variantListItemAnim}
                  className={
                    "p-4 bg-white rounded-lg shadow-sm border-l-2 border-green-500 hover:shadow-md transition-shadow"
                  }
                >
                  <span className={"font-medium text-gray-800"}>{feature}</span>
                </motion.li>
              ))}
            </motion.ol>
          </div>
          <Button
            variant={"link"}
            className={"hover:cursor-pointer"}
            onClick={() =>
              navigateTo({
                router: router,
                url: "/features",
              })
            }
          >
            Tìm hiểu thêm
          </Button>
        </div>
      </ScrollSection>

      <ScrollSection
        className={
          "h-[80vh] w-[75%] bg-section-1 flex flex-row items-center justify-between gap-3 rounded-lg shadow-2xl p-3"
        }
      >
        <motion.div
          {...getScrollAnimation({ direction: "left", config: scrollConfig })}
          variants={variantSlideAnimation}
          className={"w-[40%] p-2"}
        >
          <Image
            loading={"eager"}
            src={logo.src}
            width={2000}
            height={2000}
            alt={"logo"}
            className={"w-full rounded-lg shadow-2xl"}
          />
        </motion.div>
        <div
          className={
            "w-[60%] p-2 gap-3 flex flex-col justify-center items-center"
          }
        >
          <motion.p
            {...getScrollAnimation({
              direction: "right",
              config: scrollConfig,
            })}
            variants={variantSlideAnimation}
            className={"text-2xl font-semibold"}
          >
            Bắt đầu hành trình của bạn với chúng tôi
          </motion.p>
          <motion.p
            {...getScrollAnimation({ direction: "left", config: scrollConfig })}
            variants={variantSlideAnimation}
          >
            Tạo nhóm cho gia đình bạn, mời người thân tham gia và cùng nhau tìm
            hiểu, xây dựng &apos;gia phả số&apos; thật sống động đi nào!
          </motion.p>
          <Button
            variant={"link"}
            className={"hover:cursor-pointer"}
            onClick={() =>
              navigateTo({
                router: router,
                url: "/group",
              })
            }
          >
            Tạo nhóm ngay
          </Button>
        </div>
      </ScrollSection>
    </div>
  );
};
export default HomePage;
