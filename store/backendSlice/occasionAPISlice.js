import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const occasionAPISlice = createApi({
  reducerPath: "occasionAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/occasion`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Occasion"],
  endpoints: (builder) => ({
    getAllOccasions: builder.query({
      query: () => "/all-occasions",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ OccasionID }) => ({ type: "Occasion", id: OccasionID })),
              { type: "Occasion", id: "LIST" },
            ]
          : [{ type: "Occasion", id: "LIST" }],
    }),
    getOccasionById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Occasion", id: Number(id) }],
    }),
    saveOccasion: builder.mutation({
      query: (formData) => ({
        url: "/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Occasion", id: "LIST" },
        ...(result?.OccasionID ? [{ type: "Occasion", id: Number(result.OccasionID) }] : []),
      ],
    }),
    deleteOccasion: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Occasion", id: Number(id) },
        { type: "Occasion", id: "LIST" },
      ],
    }),
    getMaxOccasionDisplayOrder: builder.query({
      query: () => "/max-display-order",
      providesTags: [{ type: "Occasion", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllOccasionsQuery,
  useGetOccasionByIdQuery,
  useSaveOccasionMutation,
  useDeleteOccasionMutation,
  useGetMaxOccasionDisplayOrderQuery,
} = occasionAPISlice;
