//storing all blogs

import { IBlogDto } from "@/modules/blog/blog.dto";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BlogState {
  blogs: {
    [slug: string]: {
      origin: IBlogDto;
      draft: IBlogDto;
      isModified: boolean;
    };
  };
}

const safeSlug = ["build-flow", "group-family", "group-members", "events"];

const createEmptyBlog = (slug: string): IBlogDto => ({
  id: "",
  slug: slug,
  title: "",
  content: "",
});

const blogSlice = createSlice({
  name: "blog",
  initialState: { blogs: {} } as BlogState,
  reducers: {
    initializeBlog: (state, action: PayloadAction<IBlogDto>) => {
      const { slug, content } = action.payload;
      if (!state.blogs[slug] && safeSlug.includes(slug)) {
        if (content.length !== 0) {
          state.blogs[slug] = {
            origin: action.payload,
            draft: action.payload,
            isModified: false,
          };
        } else {
          const emptyBlog = createEmptyBlog(slug);
          state.blogs[slug] = {
            origin: emptyBlog,
            draft: emptyBlog,
            isModified: false,
          };
        }
      }
    },
    updateDraft: (
      state,
      action: PayloadAction<{ slug: string; data: string }>,
    ) => {
      const { slug, data } = action.payload;

      if (!state.blogs[slug]) {
        const emptyBlog = createEmptyBlog(slug);
        state.blogs[slug] = {
          origin: emptyBlog,
          draft: { ...emptyBlog, content: data },
          isModified: true,
        };
      } else {
        state.blogs[slug].draft.content = data;
        state.blogs[slug].isModified =
          state.blogs[slug].draft.content !== state.blogs[slug].origin.content;
      }
    },
    syncSuccess: (state, action: PayloadAction<IBlogDto>) => {
      const { slug } = action.payload;
      if (state.blogs[slug]) {
        state.blogs[slug].origin = action.payload;
        state.blogs[slug].draft = action.payload;
        state.blogs[slug].isModified = false;
      }
    },
  },
});

export const { initializeBlog, updateDraft, syncSuccess } = blogSlice.actions;
export default blogSlice.reducer;
