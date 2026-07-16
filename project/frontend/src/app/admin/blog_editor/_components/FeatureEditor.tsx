"use client";

import dynamic from "next/dynamic";
import { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
import { IPaginationBase } from "@/types/base.types";
import { LoaderModule } from "@/components/shared/loader-module";
import { ApiResponse } from "@/types/api.types";

const FeatureEditorInternal = dynamic(() => import("./FeatureEditorInternal"), {
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
  blog: IBlogDto | ApiResponse<IBlogDto, unknown>;
  slug: string;
  list: IPaginationBase<IBlogsDto[]> | ApiResponse<IBlogsDto[], unknown>;
}

export default function FeatureEditor({
  blog,
  slug,
  list,
}: FeatureEditorProps) {
  return <FeatureEditorInternal blog={blog} slug={slug} list={list} />;
}
