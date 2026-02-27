import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "..";
import isEqual from "lodash.isequal";
import { updateBlogAction } from "@/modules/blog/blog.action";
import { syncSuccess } from "./blogSlice";

export const saveBlogDraft = createAsyncThunk(
  "blog/save",
  async (slug: string, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as RootState;
    const blogEntry = state.blog.blogs[slug];

    // 1. Kiểm tra xem blog có tồn tại không
    if (!blogEntry) return rejectWithValue("Blog không tồn tại");

    const { draft, origin, isModified } = blogEntry;

    // 2. So sánh dữ liệu (Sử dụng flag isModified đã tính ở Reducer hoặc isEqual)
    // Nếu không có thay đổi thì thoát sớm để tiết kiệm tài nguyên mạng
    if (!isModified || isEqual(draft, origin)) {
      //console.log("Không có thay đổi, không cần lưu.");
      return;
    }

    const result = await updateBlogAction(draft);

    if (result && "error" in result) {
      return rejectWithValue(result.error);
    } else dispatch(syncSuccess(result));

    return result;
  },
);
