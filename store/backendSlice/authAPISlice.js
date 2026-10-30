import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearAuth } from "./authReducer";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader = "Basic " + btoa(`${username}:${password}`);

export const authAPISlice = createApi({
  reducerPath: "authAPISlice",
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    credentials: "include",
    prepareHeaders: (headers, { endpoint }) => {
      headers.set("Authorization", authHeader);
      if (endpoint !== "signIn") {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({
        url: "/auth/all-user",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    signIn: builder.mutation({
      query: (formData) => ({
        url: "/auth/save-or-update-user",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    checkLogin: builder.query({
      query: () => ({
        url: "/auth/check-login",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearAuth());
        } catch (err) {
          console.error("Logout failed:", err);
        }
      },
    }),
    getUserById: builder.query({
      query: (id) => `/auth/fill-user-data?loginID=${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    updateUserStatus: builder.mutation({
      query: ({ UserID, ActiveStatus }) => ({
        url: `/update-status`,
        method: "POST",
        body: { UserID, ActiveStatus },
      }),
      invalidatesTags: (result, error, { UserID }) => [
        { type: "User", id: UserID },
      ],
    }),
    updatePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/update-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetUserByIdQuery,
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useSignInMutation,
  useLoginMutation,
  useCheckLoginQuery,
  useLogoutMutation,
  useUpdatePasswordMutation
} = authAPISlice;
