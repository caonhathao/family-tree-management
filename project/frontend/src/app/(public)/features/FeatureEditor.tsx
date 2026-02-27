"use client";

import dynamic from "next/dynamic";
import { IBlogDto } from "@/modules/blog/blog.dto";
import { IErrorResponse } from "@/types/base.types";
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
  user: { id: string; role: string } | null;
  slug: string;
}

export default function FeatureEditor({
  blog,
  user,
  slug,
}: FeatureEditorProps) {
  return <EditorJSComponent blog={blog} user={user} slug={slug} />;
}
