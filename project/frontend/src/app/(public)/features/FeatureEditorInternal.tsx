"use client";

import { IBlogDto } from "@/modules/blog/blog.dto";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Toaster } from "@/components/shared/toast";
import { IErrorResponse } from "@/types/base.types";
import { Button } from "@/components/ui/button";
import { FaPen } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  initializeBlog,
  syncSuccess,
  updateDraft,
} from "@/store/blog/blogSlice";
import { saveBlogDraft } from "@/store/blog/blogThunk";
import { useRouter } from "next/navigation";
import { IBlogMediaDto } from "@/modules/blog-media/blog.dto";
import { safeJsonParse } from "../../../lib/util/utils.lib";

interface FeatureEditorProps {
  blog: IBlogDto | IErrorResponse;
  user: { id: string; role: string } | null;
  slug: string;
}

const EDITOR_HOLDER_ID = "editorjs";

export default function FeatureEditorInternal({
  blog,
  user,
  slug,
}: FeatureEditorProps) {
  const isAdmin = user?.role === "ADMIN";
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [data, setData] = useState<OutputData>(() => {
    if (blog && "content" in blog && typeof blog.content === "string") {
      try {
        return safeJsonParse(blog.content);
      } catch (e) {
        console.error("Failed to parse blog content", e);
      }
    }

    // return the default of editor data if blog is empty
    return {
      time: Date.now(),
      blocks: [],
      version: "2.28.2",
    };
  });
  const { blogs } = useSelector((state: RootState) => state.blog);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const ejInstance = useRef<EditorJS | null>(null);

  const initEditor = useCallback(() => {
    if (ejInstance.current) {
      return;
    }

    const editor = new EditorJS({
      holder: EDITOR_HOLDER_ID,
      data,
      onChange: async () => {
        const currentContent = await editor.save();
        // Dispatch cập nhật bản draft trong Redux
        dispatch(
          updateDraft({
            slug,
            data: JSON.stringify(currentContent),
          }),
        );
      },
      readOnly: isReadOnly,
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
  }, [data, dispatch, isReadOnly, slug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!ejInstance.current) {
        initEditor();
      }
    }
    if (blog && "content" in blog && typeof blog.content === "string") {
      dispatch(initializeBlog(blog));
    }

    return () => {
      if (ejInstance.current && ejInstance.current.destroy) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
  }, [blog, dispatch, initEditor]);

  useEffect(() => {
    console.log("blog:", blog);
    console.log("data", data);
  }, [blog, data]);

  const handleEdit = () => {
    if (ejInstance.current) {
      ejInstance.current.readOnly.toggle(false);
      setIsReadOnly(false);
    }
  };

  const handleCancel = () => {
    if (ejInstance.current) {
      ejInstance.current.readOnly.toggle(true);
      setIsReadOnly(true);
      try {
        const originData = safeJsonParse(
          blogs[slug].origin.content,
        ) as OutputData;

        setData(originData);
        dispatch(syncSuccess(blogs[slug].origin));
        ejInstance.current.render(originData);
      } catch (e) {
        console.error("error when parsing json: ", e);
      }
    }
  };

  const handleSave = async () => {
    if (ejInstance.current) {
      const savedData = await ejInstance.current.save();
      //we get the header from saveData and slog from searchParams

      //update the existed blog
      if (blog && "id" in blog && typeof blog.id === "string") {
        const res: IErrorResponse | IBlogDto | undefined = await dispatch(
          saveBlogDraft(slug),
        ).unwrap();
        if (res && "id" in res && res.id?.length !== 0) {
          setData(savedData);
          ejInstance.current.readOnly.toggle(true);
          setIsReadOnly(true);
          Toaster({
            title: "Hành động thành công",
            description: "Blog đã được lưu thành công",
            type: "success",
            cancel: { label: "OK", onClick: () => {} },
          });
          dispatch(syncSuccess(res));
        } else if (res && "error" in res) {
          if (res.error === "Unauthorized") {
            const callbackUrl = encodeURIComponent(window.location.href);
            router.push(`/auth?mode=login&callbackUrl=${callbackUrl}`);
            return;
          }

          Toaster({
            title: "Hành động thất bại",
            description: "Failed to save blog: " + res.error,
            type: "error",
            cancel: { label: "OK", onClick: () => {} },
          });
        }
        Toaster({
          title: "Hành động thất bại",
          description: "Không có gì thay đổi",
          type: "warning",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
    } else {
      Toaster({
        title: "Hành động thất bại",
        description: "Có lỗi xảy ra",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  };
  return (
    <div className={"prose lg:prose-xl max-w-full px-6"}>
      <div className={"flex justify-between items-center"}>
        {isAdmin && (
          <div className={"fixed top-20 right-5"}>
            {slug.length !== 0 ? (
              isReadOnly ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"outline"}
                      size={"icon"}
                      onClick={handleEdit}
                      className={"hover:cursor-pointer"}
                    >
                      <FaPen />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={"left"}>Sửa bài viết</TooltipContent>
                </Tooltip>
              ) : (
                <div
                  className={"flex flex-row justify-between items-center gap-2"}
                >
                  <Button
                    variant={"outline"}
                    onClick={handleSave}
                    className={"hover:cursor-pointer"}
                  >
                    Lưu
                  </Button>
                  <Button
                    variant={"secondary"}
                    onClick={handleCancel}
                    className={"hover:cursor-pointer"}
                  >
                    Hủy
                  </Button>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
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
        className={`${
          isReadOnly
            ? "read-only-editor px-6 py-3 w-full h-full"
            : "rounded-lg border bg-card p-6 shadow-sm"
        }`}
      />
    </div>
  );
}
