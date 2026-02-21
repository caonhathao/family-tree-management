"use client";

import {
  IBlogDetailDto,
  IBlogResponseDto,
  IUpdateBlogDto,
} from "@/modules/blog/blog.dto";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateBlogAction } from "@/modules/blog/blog.action";
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

interface FeatureEditorProps {
  blog: IBlogDetailDto | IErrorResponse;
  user: { id: string; role: string } | null;
}

const EDITOR_HOLDER_ID = "editorjs";

export default function FeatureEditorInternal({
  blog,
  user,
}: FeatureEditorProps) {
  const isAdmin = user?.role === "ADMIN";
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [data, setData] = useState<OutputData>(() => {
    // Kiểm tra an toàn: blog tồn tại và có thuộc tính content
    if (blog && "content" in blog && typeof blog.content === "string") {
      try {
        return JSON.parse(blog.content);
      } catch (e) {
        console.error("Failed to parse blog content", e);
      }
    }

    // Trả về cấu trúc mặc định của Editor.js nếu không có dữ liệu
    return {
      time: Date.now(),
      blocks: [],
      version: "2.28.2",
    };
  });
  const ejInstance = useRef<EditorJS | null>(null);

  const initEditor = useCallback(() => {
    if (ejInstance.current) {
      return;
    }

    const editor = new EditorJS({
      holder: EDITOR_HOLDER_ID,
      data,
      readOnly: isReadOnly,
      onReady: () => {
        ejInstance.current = editor;
      },
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
                const res = await uploadBlogMediaAction("IMAGE", file);
                if ("url" in res && typeof res.url === "string") {
                  return {
                    success: 1,
                    file: {
                      url: res.url,
                    },
                  };
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
  }, [data, isReadOnly]);

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
  }, [initEditor]);

  const handleEdit = () => {
    if (ejInstance.current) {
      ejInstance.current.readOnly.toggle(false);
      setIsReadOnly(false);
    }
  };

  const handleCancel = () => {
    if (ejInstance.current) {
      // This is a simplified cancel. A more robust implementation
      // might involve re-initializing the editor with the original data.
      ejInstance.current.readOnly.toggle(true);
      setIsReadOnly(true);
    }
  };

  const handleSave = async () => {
    if (ejInstance.current && blog && "id" in blog) {
      const savedData = await ejInstance.current.save();
      const updateDto: IUpdateBlogDto = {
        blogId: blog.id,
        title: blog.title, // Assuming title is not changed here
        slug: blog.slug, // Assuming slug is not changed here
        content: JSON.stringify(savedData),
      };
      try {
        const res: IErrorResponse | IBlogResponseDto =
          await updateBlogAction(updateDto);
        if ("id" in res && typeof res.id === "string") {
          setData(savedData);
          ejInstance.current.readOnly.toggle(true);
          setIsReadOnly(true);
          Toaster({
            title: "Hành động thành công",
            description: "Blog đã được lưu thành công",
            type: "success",
            cancel: { label: "OK", onClick: () => {} },
          });
        } else {
          Toaster({
            title: "Hành động thất bại",
            description:
              "Failed to save blog: " + (res as IErrorResponse).error,
            type: "error",
            cancel: { label: "OK", onClick: () => {} },
          });
        }
      } catch (error) {
        Toaster({
          title: "Hành động thất bại",
          description: "Có lỗi xảy ra",
          type: "error",
          cancel: { label: "OK", onClick: () => {} },
        });
        console.error("Failed to save blog:", error);
      }
    }
  };
  return (
    <div className={"prose lg:prose-xl max-w-full"}>
      <div className={"flex justify-between items-center mb-4"}>
        <h1 className={"mb-0"}>{blog && "title" in blog ? blog.title : ""}</h1>
        {isAdmin && (
          <div className={"fixed top-20 right-5"}>
            {isReadOnly ? (
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
            )}
          </div>
        )}
      </div>

      <div
        id={EDITOR_HOLDER_ID}
        className={`${
          isReadOnly
            ? "read-only-editor"
            : "rounded-lg border bg-card p-4 shadow-sm"
        }`}
      />
    </div>
  );
}
