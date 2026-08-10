import { configureStore, combineReducers, Action } from "@reduxjs/toolkit";
import familySlice from "./family/familySlice";
import userSlice from "./user/userSlice";
import blogSlice from "./blog/blogSlice";
import eventsSlice from "./events/eventsSlice";

// 1. Gộp các slice lại thành một appReducer
const appReducer = combineReducers({
  family: familySlice,
  user: userSlice,
  blog: blogSlice,
  events: eventsSlice,
});

// 2. Tạo một Root Reducer để bắt chặn action "LOGOUT"
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: Action,
) => {
  if (action.type === "user/logoutReset") {
    // Khi nhận được action logout, ta trả về undefined.
    // Redux sẽ tự động ép tất cả các slice về initialState của chúng.
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
