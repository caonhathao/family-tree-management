import { getBlogAction } from "@/modules/blog/blog.action";
import { IBlogDto } from "@/modules/blog/blog.dto";
import { IErrorResponse } from "@/types/base.types";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query";

export const blogApi = createApi({
  reducerPath: "blogApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getBlogBySlug: builder.query<IBlogDto, string>({
      queryFn: async (slug) => {
        const result: IBlogDto | IErrorResponse = await getBlogAction(slug);

        if (result && "error" in result) {
          return { error: result as IErrorResponse };
        }

        return { data: result };
      },
    }),
  }),
});
