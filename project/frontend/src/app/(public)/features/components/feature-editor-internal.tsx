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
import { IBlogMediaDto } from "@/modules/blog-media/blog.dto";
import { safeJsonParse } from "../../../../lib/utils/funcs.utils";
import FeatureStaticContent from "./feature-static-content";
import { ApiResponse } from "@/types/api.types";

interface FeatureEditorProps {
  blog: IBlogDto | ApiResponse<IBlogDto, unknown>;
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
                const res: IBlogMediaDto | ApiResponse<IBlogMediaDto, unknown> =
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

  // useEffect(() => {
  //   console.log("blog:", blog);
  //   console.log("data", data);
  // }, [blog, data]);

  return (
    <div className={"prose lg:prose-xl max-w-full px-6"}>
      {slug.length === 0 ? <FeatureStaticContent /> : null}

      <div
        id={EDITOR_HOLDER_ID}
        className={"read-only-editor px-6 py-3 w-full h-full"}
      />
    </div>
  );
}
