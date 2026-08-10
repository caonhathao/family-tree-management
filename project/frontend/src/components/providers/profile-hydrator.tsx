"use client";

import { getUserDetailAction } from "@/modules/user/user.actions";
import { IResponseUserDto } from "@/modules/user/user.dto";
import { AppDispatch, RootState } from "@/store";
import { setProfile } from "@/store/user/userSlice";
import { ApiResponse } from "@/types/api.types";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

export function ProfileHydrator() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const profileId = useSelector((state: RootState) => state.user.profile.id);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (profileId !== "") return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = (await getUserDetailAction("self")) as
          | IResponseUserDto
          | ApiResponse<IResponseUserDto, unknown>;

        if (cancelled) return;
        if (res && "userProfile" in res) {
          const serializableProfile: IResponseUserDto = {
            ...res,
            userProfile: {
              ...res.userProfile,
              dateOfBirth: res.userProfile.dateOfBirth,
            },
          };
          dispatch(setProfile(serializableProfile));
        }
      } finally {
        inFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      inFlightRef.current = false;
    };
  }, [dispatch, pathname, profileId]);

  return null;
}
