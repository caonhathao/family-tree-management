"use client";
import { Toaster } from "@/components/shared/toast";
import { logoutAction } from "@/modules/auth/auth.actions";
import { clearProfile } from "@/store/user/userSlice";
import { ApiResponse } from "@/types/api.types";
import { TransitionStartFunction } from "react";

export const handleLogOut = ({
  startTransition,
  dispatch,
}: {
  startTransition: TransitionStartFunction;
  dispatch: (payload: unknown) => void;
}) => {
  startTransition(async () => {
    const result: ApiResponse<never, unknown> | undefined =
      await logoutAction();
    //console.log(result);
    if (result && "errors" in result) {
      Toaster({
        title: "Đăng xuất thất bại",
        description: result.message,
        type: "error",
      });
    }
    dispatch(clearProfile);
    window.location.href = "/auth?mode=login";
  });
};
