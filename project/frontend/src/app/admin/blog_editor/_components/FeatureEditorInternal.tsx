"use client";

import { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
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
import { IErrorResponse, IPaginationBase } from "@/types/base.types";
import { Button } from "@/components/ui/button";
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
import { safeJsonParse } from "../../../../lib/util/utils.lib";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaCheck } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import z from "zod";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface FeatureEditorProps {
  blog: IBlogDto | IErrorResponse;
  slug: string;
  list: IPaginationBase<IBlogsDto[]> | IErrorResponse;
}

const EDITOR_HOLDER_ID = "editorjs";

// const defaultSlug = [
//   {
//     key: "build-flow",
//     title: "Tính năng - Dựng sơ đồ",
//   },
//   {
//     key: "group-family",
//     title: "Tính năng - Nhóm gia đình",
//   },
//   {
//     key: "storage",
//     title: "Tính năng - Lưu trữ",
//   },
//   {
//     key: "events",
//     title: "Tính năng - Sự kiện",
//   },
// ];

const formSchema = z.object({
  newSlug: z.string().min(1, "Vui lòng nhập slug"),
});

export default function FeatureEditorInternal({
  blog,
  slug,
  list,
}: FeatureEditorProps) {
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [data, setData] = useState<OutputData>(() => {
    if (blog && "content" in blog && typeof blog.content === "string") {
      try {
        return safeJsonParse(blog.content);
      } catch (e) {
        console.error("Failed to parse blog content", e);
      }
    }
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSlug: "others",
    },
  });

  const initEditor = useCallback(() => {
    if (ejInstance.current) {
      return;
    }

    const editor = new EditorJS({
      holder: EDITOR_HOLDER_ID,
      data,
      onChange: async () => {
        const currentContent = await editor.save();
        if (currentContent) {
          // Dispatch cập nhật bản draft trong Redux
          dispatch(
            updateDraft({
              slug: slug,
              data: JSON.stringify(currentContent),
            }),
          );
        }
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
    // console.log(otherBlog);
    // console.log(slug);
  }, [blog, data, slug]);

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

        if (originData) {
          setData(originData);
          dispatch(syncSuccess(blogs[slug].origin));
          ejInstance.current.render(originData);
        }
      } catch (e) {
        setData({
          time: Date.now(),
          blocks: [],
          version: "2.28.2",
        });
        console.error("error when parsing json: ", e);
      }
    }
  };

  const handleSave = async () => {
    if (ejInstance.current) {
      const savedData = await ejInstance.current.save();
      //console.log(savedData);
      //we get the header from saveData and slog from searchParams
      const res: IErrorResponse | IBlogDto | boolean | undefined =
        await dispatch(saveBlogDraft(slug)).unwrap();
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
      } else if (res === false)
        Toaster({
          title: "Hành động thất bại",
          description: "Không có gì thay đổi",
          type: "warning",
          cancel: { label: "OK", onClick: () => {} },
        });
    } else {
      Toaster({
        title: "Hành động thất bại",
        description: "Có lỗi xảy ra",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  };

  const handleConfirmNewSlug = (data: z.infer<typeof formSchema>) => {
    router.push(`/admin/blog_editor?part=${data.newSlug}`);
  };

  const onInvalid = (errors: FieldErrors<z.infer<typeof formSchema>>) => {
    if (errors.newSlug) {
      Toaster({
        title: "Slug không hợp lệ",
        description: errors.newSlug.message || "Vui lòng kiểm tra lại slug",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  };

  return (
    <div className={"prose lg:prose-xl max-w-full p-6 flex flex-col gap-2"}>
      <div className={"w-full flex justify-start items-center gap-2"}>
        {isReadOnly ? (
          <div className={"flex flex-row justify-between items-center gap-2"}>
            <Select
              value={slug}
              onValueChange={(value) => {
                setIsReadOnly(true);
                router.push(`/admin/blog_editor?part=${value}`);
              }}
            >
              <SelectTrigger className={"hover:cursor-pointer"}>
                <SelectValue placeholder={"Chọn bài viết"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    key={"others"}
                    value={"others"}
                    className={"hover:cursor-pointer"}
                  >
                    Khác
                  </SelectItem>
                  {list && "error" in list
                    ? null
                    : list.data.map((item) => {
                        return (
                          <SelectItem
                            key={item.id}
                            value={item.slug}
                            className={"hover:cursor-pointer"}
                          >
                            {item.title}
                          </SelectItem>
                        );
                      })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {slug === "others" ? (
              <form
                onSubmit={form.handleSubmit(handleConfirmNewSlug, onInvalid)}
                className={"flex flex-row gap-2"}
              >
                <Controller
                  name={"newSlug"}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Input
                        {...field}
                        id={"other"}
                        autoComplete={"off"}
                        placeholder={"Slug của bài viết"}
                      />
                    </Field>
                  )}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"outline"}
                      size={"icon"}
                      type={"submit"}
                      className={"hover:cursor-pointer"}
                    >
                      <FaCheck />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xác nhận slug mới</TooltipContent>
                </Tooltip>
              </form>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    className={"hover:cursor-pointer"}
                    onClick={() => handleEdit()}
                  >
                    <FaPen />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chỉnh sửa</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div className={"flex flex-row justify-between items-center gap-2"}>
            <Button
              variant={"outline"}
              onClick={() => handleSave()}
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
