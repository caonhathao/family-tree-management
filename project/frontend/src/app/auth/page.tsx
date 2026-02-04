"use client";

import { Suspense } from "react";
import AuthContent from "./components/auth-content";
import { LoaderModule } from "@/components/shared/loader-module";

const AuthPage = () => {
  return (
    // Bọc Suspense ở cấp độ cao nhất của trang Page
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <LoaderModule />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
