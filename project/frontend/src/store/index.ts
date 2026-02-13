import { configureStore } from "@reduxjs/toolkit";
import familySlice from "./family/familySlice";
import userSlice from "./user/userSlice";

export const store = configureStore({
  reducer: {
    family: familySlice,
    user: userSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
