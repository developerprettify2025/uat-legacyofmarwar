import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const authHeader = username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const categoryAPISlice = createApi({
  reducerPath: "categoryAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/category`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    getAllCategorys: builder.query({
      query: () => `/all-categorys`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ CategoryID }) => ({ type: "Category", id: CategoryID })),
            { type: "Category", id: "LIST" },
          ]
          : [{ type: "Category", id: "LIST" }],
    }),
    getCategoryById: builder.query({
      query: (id) => `/fill-category-data?CategoryID=${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    saveOrUpdateCategory: builder.mutation({
      query: (formData) => ({
        url: `/save-or-update-category`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    deleteCategory: builder.mutation({
      query: (CategoryID) => ({
        url: `/delete-category/${CategoryID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, CategoryID) => [
        { type: "Category", id: CategoryID },
        { type: "Category", id: "LIST" },
      ],
    }),
    updateDisplayOrder: builder.mutation({
      query: (data) => ({
        url: `/update-display-order`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    getMaxDisplayOrder: builder.query({
      query: () => `/max-display-order`,
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategoryStatus: builder.mutation({
      query: ({ CategoryID, ActiveStatus }) => ({
        url: `/update-status`,
        method: "POST",
        body: { CategoryID, ActiveStatus },
      }),
      invalidatesTags: (result, error, { CategoryID }) => [
        { type: "Category", id: CategoryID },
      ],
    }),
    getAllActiveCategorys: builder.query({
      query: () => `/categorys`,
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
    getCategoryBySlug: builder.query({
      query: (slug) => `/fetch-category/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Category", id: slug }],
    }),

  }),
});

export const {
  useGetAllCategorysQuery,
  useGetCategoryByIdQuery,
  useSaveOrUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateDisplayOrderMutation,
  useGetMaxDisplayOrderQuery,
  useUpdateCategoryStatusMutation,
  useGetAllActiveCategorysQuery,
  useGetCategoryBySlugQuery,
} = categoryAPISlice;

