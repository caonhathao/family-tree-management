"use client";
//this page will show all features that the project has
//this component will show 4 parts:
//1. introduction
//2. main features:
// in this part, we will introduce 4 features: draw flow, group, album and event
//3. Others
//4. Q&A

import { useRouter } from "next/navigation";

const FeatureMenu = () => {
  const router = useRouter();
  const handleToRoute = (q: string) => {
    router.push("/features?part=" + q);
  };
  return (
    <div className={"flex flex-col p-2 gap-3 border-r-2 border-gray-300"}>
      <div className={""}>
        <p className={"text-lg font-semibold"}>Tính năng chính</p>
        <ul className={"pl-6"}>
          <li
            className={"hover:cursor-pointer hover:underline"}
            onClick={() => handleToRoute("draw-flow")}
          >
            Tạo sơ đồ
          </li>
          <li
            className={"hover:cursor-pointer hover:underline"}
            onClick={() => handleToRoute("group")}
          >
            Nhóm
          </li>
          <li
            className={"hover:cursor-pointer hover:underline"}
            onClick={() => handleToRoute("album")}
          >
            Thư viện lưu trữ
          </li>
          <li
            className={"hover:cursor-pointer hover:underline"}
            onClick={() => handleToRoute("event")}
          >
            Sự kiện gia đình
          </li>
        </ul>
      </div>
    </div>
  );
};
export default FeatureMenu;
