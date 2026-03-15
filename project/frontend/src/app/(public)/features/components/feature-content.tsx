"use client";

import { IBlogDto } from "@/modules/blog/blog.dto";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { uploadBlogMediaAction } from "@/modules/blog-media/blog-media.action";

// Dynamically import Editor.js
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
// @ts-expect-error: Missing type definitions for @editorjs/embed
import Embed from "@editorjs/embed";
// @ts-expect-error: Missing type definitions for @editorjs/embed
import Marker from "@editorjs/marker";
import ImageTool from "@editorjs/image";
import { IErrorResponse } from "@/types/base.types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IBlogMediaDto } from "@/modules/blog-media/blog.dto";
import { safeJsonParse } from "../../../../lib/util/utils.lib";

interface FeatureEditorProps {
  blog: IBlogDto | IErrorResponse;
  slug: string;
}

const EDITOR_HOLDER_ID = "editorjs";

export default function FeatureEditorInternal({
  blog,
  slug,
}: FeatureEditorProps) {
  const data = useMemo<OutputData>(() => {
    if (blog && "content" in blog && typeof blog.content === "string") {
      try {
        return safeJsonParse(blog.content);
      } catch (e) {
        console.error("Failed to parse blog content", e);
      }
    }

    return {
      time: 0,
      blocks: [],
      version: "2.28.2",
    };
  }, [blog]);
  const router = useRouter();

  const ejInstance = useRef<EditorJS | null>(null);

  const initEditor = useCallback(() => {
    if (ejInstance.current) {
      return;
    }

    const editor = new EditorJS({
      holder: EDITOR_HOLDER_ID,
      data,
      readOnly: true,
      tools: {
        header: Header,
        list: List,
        marker: Marker,
        embed: Embed,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                const res: IBlogMediaDto | IErrorResponse =
                  await uploadBlogMediaAction("IMAGE", file);
                if (res && "url" in res && typeof res.url === "string") {
                  return {
                    success: 1,
                    file: {
                      url: res.url,
                    },
                  };
                } else {
                  throw new Error("Failed to upload image");
                }
                return {
                  success: 0,
                };
              },
            },
          },
        },
      },
    });
    ejInstance.current = editor;
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!ejInstance.current) {
        initEditor();
      }
    }

    return () => {
      if (ejInstance.current && ejInstance.current.destroy) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
  }, [blog, initEditor]);

  useEffect(() => {
    console.log("blog:", blog);
    console.log("data", data);
  }, [blog, data]);

  return (
    <div className={"prose lg:prose-xl max-w-full px-6"}>
      {slug.length === 0 ? (
        <div
          className={
            "w-full h-full flex flex-col justify-start items-start gap-3"
          }
        >
          <div>
            <div className={"font-semibold text-2xl"}>Giới thiệu</div>
            <p>Chào mừng bạn đến với trang khám phá tính năng.</p>
            <p>
              Dự án này này được ra đời nhằm mục đích số hóa gia phả gia đình,
              đồng thời giúp người dùng dễ dàng hình dung được thứ bậc của mình
              trong đại gia đình.
            </p>
            <p>
              Các tính năng hiện đang được mở rộng và phát triển, nhằm giúp
              người dùng đem lại trải nghiệm tốt nhất khi sử dụng dịch vụ.
            </p>
            Các dịch vụ (tính năng) chính, bao gồm:
            <ul>
              <li>
                Dựng sơ đồ: Cho phép người dùng tự do tạo và kết nối người thân
                trong gia đình, nhằm tạo thành 1 cây phả hệ hoàn chỉnh với các
                cấp bậc và mối quan hệ rõ ràng.
                <Button
                  variant={"link"}
                  className={"hover:cursor-pointer"}
                  onClick={() => router.push("/features?part=build-flow")}
                >
                  Xem thêm
                </Button>
              </li>
              <li>
                Nhóm gia đình: Cho phép người dùng tạo nhóm và mời thành viên
                tham gia.
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
            <p className={"text-sm"}>
              Dự án vẫn đang trong quá trình phát triển, vì vậy khó tránh khỏi
              sai sót, rất mong các bạn thông cảm.
            </p>
          </div>
        </div>
      ) : null}

      <div
        id={EDITOR_HOLDER_ID}
        className={"read-only-editor px-6 py-3 w-full h-full"}
      />
    </div>
  );
}
