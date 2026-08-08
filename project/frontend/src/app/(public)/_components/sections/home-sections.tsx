"use client";
import { motion } from "framer-motion";
import ScrollToTop from "../scroll-to-top-btn";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../../../../public/img/family-tree-logo.webp";
import {
  fadeInUpVariants,
  staggerContainerVariants,
} from "@/configs/animation/variants.amin";
import { Button } from "@/components/ui/button";
import { navigateTo } from "@/lib/utils/navigate.utils";
import { cn } from "@/lib/utils";

const features = [
  "Sơ đồ gia phả thông minh, trực quan.",
  "Số hóa tiểu sử và ký ức dòng họ.",
  "Lưu trữ hình ảnh,video gia đình",
  "Tự động nhắc nhở ngày giỗ, ngày lễ.",
  "Bảo mật và phân quyền riêng tư tuyệt đối.",
];

const sectionContent = [
  {
    title: "Gìn giữ hồn cốt gia đình \n Nối dài sợi dây huyết thống",
    desc: "Gia đình không chỉ là hiện tại, mà còn là một dòng chảy bất tận từ quá khứ đến tương lai. Hệ thống của chúng tôi không chỉ là một công cụ quản lý, mà là nơi lưu giữ những câu chuyện, những gương mặt và những giá trị đạo đức mà ông cha đã dày công xây dựng. Với giao diện trực quan và thân thiện với người dùng, chúng tôi giúp bạn số hóa gia phả, để thế hệ mai sau luôn biết mình đến từ đâu.",
    features: [],
    quote:
      "Các vua Hùng đã có công dựng nước \n Bác cháu ta phải cùng nhau giữ lấy nước",
    author: "Bác Hồ",
    hasButton: false,
    buttonContent: "",
    href: "",
  },
  {
    title: "Cách chúng tôi giúp bạn kết nối cội nguồn",
    desc: "",
    features: features,
    quote: "",
    author: "",
    hasButton: true,
    buttonContent: "Xem thêm",
    href: "/features",
  },
  {
    title: "Bắt đầu hành trình của bạn với chúng tôi",
    desc: "Tạo nhóm cho gia đình bạn, mời người thân tham gia và cùng nhau tìm hiểu, xây dựng gia phả số thật sống động đi nào!",
    features: [],
    quote: "",
    author: "",
    hasButton: true,
    buttonContent: "Tạo nhóm ngay",
    href: "/group",
  },
];

const HomeSections = () => {
  const router = useRouter();
  const MotionButton = motion.create(Button);

  return (
    <>
      <ScrollToTop />
      {sectionContent.map((item, index) => (
        <motion.section
          key={"home-section-" + index}
          className={cn(
            "w-full lg:w-4/5 border-2 border-dashed",
            index % 2 == 0
              ? "bg-section-1  md:flex-row"
              : " md:flex-row-reverse",
            "flex flex-col justify-center items-center gap-3 px-1 py-10 lg:p-10",
            "my-10 md:my-16 lg:my-24",
          )}
          variants={staggerContainerVariants}
          initial={"offscreen"}
          whileInView={"onscreen"}
          viewport={{
            once: true,
            amount: 0.2,
          }}
        >
          {/* display iamge */}
          <motion.div
            variants={fadeInUpVariants}
            className={"relative  h-60 lg:h-175 aspect-square"}
          >
            <Image
              loading={"eager"}
              src={logo.src}
              fill
              sizes={"(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 60vw"}
              priority
              alt={"family=tree-logo"}
              className={"object-cover transition-opacity duration-300"}
            />
          </motion.div>
          {/* display content  */}
          <motion.div
            className={
              "w-full text-xl gap-3 flex flex-col justify-center items-center md:items-start px-2 py-5"
            }
            variants={staggerContainerVariants}
          >
            <motion.h2
              variants={fadeInUpVariants}
              className={
                "text-2xl lg:text-4xl font-semibold text-center md:text-left whitespace-pre-line md:leading-7 lg:leading-11"
              }
            >
              {item.title}
            </motion.h2>
            {item.desc != "" ? (
              <motion.p
                className={
                  "lg:text-xl p-3 lg:p-0 whitespace-pre-line md:leading-7 lg:leading-11"
                }
                variants={fadeInUpVariants}
              >
                {item.desc}
              </motion.p>
            ) : null}
            {item.author != "" ? (
              <motion.div
                className={
                  "italic w-full flex flex-col justify-end items-end md:leading-7"
                }
                variants={fadeInUpVariants}
              >
                <p className={"text-center px-3 whitespace-pre-line"}>
                  {item.quote}
                </p>
                <p className={"px-3"}>{item.author}</p>
              </motion.div>
            ) : null}
            {item.features.length != 0
              ? features.map((feature, featureIndex) => (
                  <motion.ol
                    key={"feature-" + featureIndex}
                    className={
                      "list-none list-inside space-y-4 text-lg w-4/5 flex justify-start items-start"
                    }
                    variants={fadeInUpVariants}
                  >
                    <li
                      key={featureIndex}
                      className={
                        "w-full p-4 bg-white rounded-lg shadow-sm border-l-8 border-green-500 hover:shadow-md transition-shadow"
                      }
                    >
                      <span>{featureIndex + 1}. </span>
                      <span className={"font-medium text-gray-800"}>
                        {feature}
                      </span>
                    </li>
                  </motion.ol>
                ))
              : null}
            {item.hasButton == true ? (
              <MotionButton
                variant={"default"}
                className={
                  "hover:cursor-pointer text-sm sm:text-base p-3 rounded-md border border-primary/20 shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                }
                onClick={() =>
                  navigateTo({
                    router: router,
                    url: "/features",
                  })
                }
              >
                {item.buttonContent}
              </MotionButton>
            ) : null}
          </motion.div>
        </motion.section>
      ))}
    </>
  );
};
export default HomeSections;
