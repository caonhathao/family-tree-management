"use client";

import { store } from "@/store";
import { Provider } from "react-redux";
import { ProfileHydrator } from "./profile-hydrator";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ProfileHydrator />
      {children}
    </Provider>
  );
}
