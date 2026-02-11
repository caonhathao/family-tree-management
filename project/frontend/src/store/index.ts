import { configureStore } from "@reduxjs/toolkit";
import familySlice from "@/store/familySlide";

export const store = configureStore({
  reducer: {
    family: familySlice,
  },
});

// Đây là dòng quan trọng để fix lỗi "not found"
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
