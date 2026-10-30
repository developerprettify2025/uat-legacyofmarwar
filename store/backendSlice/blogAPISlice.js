import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const authHeader = username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const blogAPISlice = createApi({
  reducerPath: "blogAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/blog`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Blog"],
  endpoints: (builder) => ({
    getAllBlogs: builder.query({
      query: () => `/all-blogs`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ BlogID }) => ({ type: "Blog", id: BlogID })),
            { type: "Blog", id: "LIST" },
          ]
          : [{ type: "Blog", id: "LIST" }],
    }),
    getBlogById: builder.query({
      query: (id) => `/fill-blog-data?BlogID=${id}`,
      providesTags: (result, error, id) => [{ type: "Blog", id }],
    }),
    saveOrUpdateBlog: builder.mutation({
      query: (formData) => ({
        url: `/save-or-update-blog`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Blog", id: "LIST" }],
    }),
    deleteBlog: builder.mutation({
      query: (BlogID) => ({
        url: `/delete-blog/${BlogID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, BlogID) => [
        { type: "Blog", id: BlogID },
        { type: "Blog", id: "LIST" },
      ],
    }),
    updateDisplayOrder: builder.mutation({
      query: (data) => ({
        url: `/update-display-order`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Blog", id: "LIST" }],
    }),
    getMaxDisplayOrder: builder.query({
      query: () => `/max-display-order`,
      providesTags: [{ type: "Blog", id: "LIST" }],
    }),
    updateBlogStatus: builder.mutation({
      query: ({ BlogID, ActiveStatus }) => ({
        url: `/update-status`,
        method: "POST",
        body: { BlogID, ActiveStatus },
      }),
      invalidatesTags: (result, error, { BlogID }) => [
        { type: "Blog", id: BlogID },
      ],
    }),
    getAllActiveBlogs: builder.query({
      query: () => `/blogs`,
      providesTags: [{ type: "Blog", id: "LIST" }],
    }),
    getBlogBySlug: builder.query({
      query: (slug) => `/fetch-blog/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Blog", id: slug }],
    }),

  }),
});

export const {
  useGetAllBlogsQuery,
  useGetBlogByIdQuery,
  useSaveOrUpdateBlogMutation,
  useDeleteBlogMutation,
  useUpdateDisplayOrderMutation,
  useGetMaxDisplayOrderQuery,
  useUpdateBlogStatusMutation,
  useGetAllActiveBlogsQuery,
  useGetBlogBySlugQuery,
} = blogAPISlice;

