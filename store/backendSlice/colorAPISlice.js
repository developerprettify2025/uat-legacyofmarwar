import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const colorAPISlice = createApi({
  reducerPath: "colorAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/color`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Color"],
  endpoints: (builder) => ({
    getAllColors: builder.query({
      query: () => "/all-colors",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ ColorID }) => ({ type: "Color", id: ColorID })),
              { type: "Color", id: "LIST" },
            ]
          : [{ type: "Color", id: "LIST" }],
    }),
    getColorById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Color", id: Number(id) }],
    }),
    saveColor: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result) => [
        { type: "Color", id: "LIST" },
        ...(result?.ColorID ? [{ type: "Color", id: Number(result.ColorID) }] : []),
      ],
    }),
    deleteColor: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Color", id: Number(id) },
        { type: "Color", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllColorsQuery,
  useGetColorByIdQuery,
  useSaveColorMutation,
  useDeleteColorMutation,
} = colorAPISlice;
