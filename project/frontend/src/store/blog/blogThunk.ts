import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "..";
import isEqual from "lodash.isequal";
import { updateBlogAction } from "@/modules/blog/blog.action";
import { syncSuccess } from "./blogSlice";
import { IBlogDto } from "@/modules/blog/blog.dto";

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

    if (result && "errors" in result) {
      return rejectWithValue(result.message);
    } else dispatch(syncSuccess(result as IBlogDto));

    return result;
  },
);
