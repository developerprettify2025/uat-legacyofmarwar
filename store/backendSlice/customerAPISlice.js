
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const customerAPISlice = createApi({
  reducerPath: "customerAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/customer`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),

  tagTypes: ["Customer"],

  endpoints: (builder) => ({
    // Existing APIs
    getAllCustomers: builder.query({
      query: () => "/all-customers",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ CustomerID }) => ({
                type: "Customer",
                id: CustomerID,
              })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),

    getCustomerById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [
        { type: "Customer", id: Number(id) },
      ],
    }),

    saveCustomer: builder.mutation({
      query: (customerFormData) => ({
        url: "/",
        method: "POST",
        body: customerFormData,
      }),
      invalidatesTags: (result) => [
        { type: "Customer", id: "LIST" },
        ...(result?.CustomerID
          ? [{ type: "Customer", id: Number(result.CustomerID) }]
          : []),
      ],
    }),

    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Customer", id: Number(id) },
        { type: "Customer", id: "LIST" },
      ],
    }),

    // 1. Check Login
    checkUserLogin: builder.mutation({
      query: (data) => ({
        url: "/check-login",
        method: "POST",
        body: data,
      }),
    }),
    // 2. Customer Signup
    signupCustomer: builder.mutation({
      query: (data) => ({
        url: "/signup",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
    // 3. Login by OTP / Get Customer by Mobile or Email
    loginByOtp: builder.mutation({
      query: (data) => ({
        url: "/login-by-otp",
        method: "POST",
        body: data,
      }),
    }),
    // 4. Check Customer Valid by CustomerID
    checkUserValid: builder.mutation({
      query: (data) => ({
        url: "/check-valid",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetAllCustomersQuery,
  useGetCustomerByIdQuery,
  useSaveCustomerMutation,
  useDeleteCustomerMutation,
  useCheckUserLoginMutation,
  useSignupCustomerMutation,
  useLoginByOtpMutation,
  useCheckUserValidMutation,
} = customerAPISlice;
