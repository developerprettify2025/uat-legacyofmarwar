import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const mediaAPISlice = createApi({
  reducerPath: "mediaAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/media`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Media"],
  endpoints: (builder) => ({
    getAllMedias: builder.query({
      query: () => "/all-medias",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ MediaID }) => ({ type: "Media", id: MediaID })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
    }),
    getMediaById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Media", id: Number(id) }],
    }),
    saveMedia: builder.mutation({
      query: (formData) => ({
        url: "/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Media", id: "LIST" },
        ...(result?.MediaID ? [{ type: "Media", id: Number(result.MediaID) }] : []),
      ],
    }),
    deleteMedia: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Media", id: Number(id) },
        { type: "Media", id: "LIST" },
      ],
    }),
    getMaxMediaDisplayOrder: builder.query({
      query: () => "/max-display-order",
      providesTags: [{ type: "Media", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllMediasQuery,
  useGetMediaByIdQuery,
  useSaveMediaMutation,
  useDeleteMediaMutation,
  useGetMaxMediaDisplayOrderQuery,
} = mediaAPISlice;
