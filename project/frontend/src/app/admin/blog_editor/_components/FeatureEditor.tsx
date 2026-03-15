"use client";

import dynamic from "next/dynamic";
import { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
import { IErrorResponse, IPaginationBase } from "@/types/base.types";
import { LoaderModule } from "@/components/shared/loader-module";

const EditorJSComponent = dynamic(() => import("./FeatureEditorInternal"), {
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
  list: IPaginationBase<IBlogsDto[]> | IErrorResponse;
}

export default function FeatureEditor({
  blog,
  slug,
  list,
}: FeatureEditorProps) {
  return <EditorJSComponent blog={blog} slug={slug} list={list} />;
}
