import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "..";
import isEqual from "lodash.isequal";
import { updateBlogAction } from "@/modules/blog/blog.action";
import { syncSuccess } from "./blogSlice";

export const saveBlogDraft = createAsyncThunk(
  "blog/save",
  async (slug: string, { getState, dispatch, rejectWithValue }) => {
    console.log(slug);
    const state = getState() as RootState;
    const blogEntry = state.blog.blogs[slug];

    if (!blogEntry) return rejectWithValue("Blog không tồn tại");

    const { draft, origin, isModified } = blogEntry;

    if (!isModified || isEqual(draft, origin)) {
      return false;
    }

    const result = await updateBlogAction(draft);

    if (result && "error" in result) {
      return rejectWithValue(result.error);
    } else dispatch(syncSuccess(result));

    return result;
  },
);
