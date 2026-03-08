"use client";
import { Toaster } from "@/components/shared/toast";
import { logoutAction } from "@/modules/auth/auth.actions";
import { clearProfile } from "@/store/user/userSlice";
import { IErrorResponse } from "@/types/base.types";
import { TransitionStartFunction } from "react";

export const handleLogOut = ({
  startTransition,
  dispatch,
}: {
  startTransition: TransitionStartFunction;
  dispatch: (payload: unknown) => void;
}) => {
  startTransition(async () => {
    const result: IErrorResponse | undefined = await logoutAction();
    //console.log(result);
    if (result?.error) {
      Toaster({
        title: "Đăng xuất thất bại",
        description: result.error,
        type: "error",
      });
    }
    dispatch(clearProfile);
    window.location.href = "/auth?mode=login";
  });
};
