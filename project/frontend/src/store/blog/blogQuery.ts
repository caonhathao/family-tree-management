import { getBlogAction } from "@/modules/blog/blog.action";
import { IBlogDto } from "@/modules/blog/blog.dto";
import { ApiResponse } from "@/types/api.types";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query";

export const blogApi = createApi({
  reducerPath: "blogApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getBlogBySlug: builder.query<IBlogDto, string>({
      queryFn: async (slug) => {
        const result: IBlogDto | ApiResponse<IBlogDto, unknown> =
          await getBlogAction(slug);

        if (result && "id" in result) {
          return { data: result };
        }

        return { error: result };
      },
    }),
  }),
});
