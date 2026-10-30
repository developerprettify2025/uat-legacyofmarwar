import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ Browser-safe basic auth header
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const staticAPISlice = createApi({
  reducerPath: "staticAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/page`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) {
        headers.set("Authorization", authHeader);
      }
      return headers;
    },
  }),
  tagTypes: ["Static"],
  endpoints: (builder) => ({

    // ✅ Get all statics
    getStatics: builder.query({
      query: () => `/all-statics`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ StaticID }) => ({ type: "Static", id: StaticID })),
              { type: "Static", id: "LIST" },
            ]
          : [{ type: "Static", id: "LIST" }],
    }),

    // ✅ Get static by ID
    getStaticById: builder.query({
      query: (id) => `/fill-static-data?StaticID=${id}`,
      providesTags: (result, error, id) => [{ type: "Static", id }],
    }),

    // ✅ Save or update static (with image upload support)
    saveOrUpdateStatic: builder.mutation({
      query: (formData) => ({
        url: `/save-or-update-static`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Static", id: "LIST" }],
    }),

    // ✅ Delete static
    deleteStatic: builder.mutation({
      query: (StaticID) => ({
        url: `/delete-static/${StaticID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, StaticID) => [
        { type: "Static", id: StaticID },
        { type: "Static", id: "LIST" },
      ],
    }),

    // ✅ Get Meta Data for frontend
    getMetaDataById: builder.query({
      query: (id) => `/meta_data/${id}`,
      providesTags: (result, error, id) => [{ type: "Static", id }],
    }),
  }),
});

export const {
  useGetStaticsQuery,
  useGetStaticByIdQuery,
  useSaveOrUpdateStaticMutation,
  useDeleteStaticMutation,
  useGetMetaDataByIdQuery,
} = staticAPISlice;