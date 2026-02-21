"use client";

import dynamic from "next/dynamic";
import { IBlogDetailDto } from "@/modules/blog/blog.dto";
import { IErrorResponse } from "@/types/base.types";

// ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT
const EditorJSComponent = dynamic(
  () => import("./FeatureEditorInternal"), // Đường dẫn tới file bạn vừa tạo ở Bước 1
  {
    ssr: false, // Tắt render ở server
    loading: () => (
      <div
        className={
          "w-full h-64 flex items-center justify-center animate-pulse bg-gray-50 rounded-lg"
        }
      >
        <p className={"text-gray-400"}>Đang tải bộ soạn thảo...</p>
      </div>
    ),
  },
);

interface FeatureEditorProps {
  blog: IBlogDetailDto | IErrorResponse;
  user: { id: string; role: string } | null;
}

export default function FeatureEditor({ blog, user }: FeatureEditorProps) {
  return <EditorJSComponent blog={blog} user={user} />;
}
