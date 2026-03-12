"use client";

import dynamic from "next/dynamic";
import { IBlogDto } from "@/modules/blog/blog.dto";
import { IErrorResponse } from "@/types/base.types";
import { LoaderModule } from "@/components/shared/loader-module";

const EditorJSComponent = dynamic(() => import("./feature-content"), {
  ssr: false,
  loading: () => (
    <div
      className={
        "w-full h-64 flex items-center justify-center animate-pulse rounded-lg"
      }
    >
      <LoaderModule />
    </div>
  ),
});

interface FeatureEditorProps {
  blog: IBlogDto | IErrorResponse;
  slug: string;
}

export default function FeatureEditor({ blog, slug }: FeatureEditorProps) {
  return <EditorJSComponent blog={blog} slug={slug} />;
}
