import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const couponAPISlice = createApi({
  reducerPath: "couponAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/coupon`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Coupon"],
  endpoints: (builder) => ({
    getAllCoupons: builder.query({
      query: () => "/all-coupons",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ CouponID }) => ({ type: "Coupon", id: CouponID })),
              { type: "Coupon", id: "LIST" },
            ]
          : [{ type: "Coupon", id: "LIST" }],
    }),
    getCouponById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Coupon", id: Number(id) }],
    }),
    saveCoupon: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result) => [
        { type: "Coupon", id: "LIST" },
        ...(result?.CouponID ? [{ type: "Coupon", id: Number(result.CouponID) }] : []),
      ],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Coupon", id: Number(id) },
        { type: "Coupon", id: "LIST" },
      ],
    }),
    // Customer: cart page par coupon apply
    applyCoupon: builder.mutation({
      query: (payload) => ({ url: "/apply", method: "POST", body: payload }),
    }),
  }),
});

export const {
  useGetAllCouponsQuery,
  useGetCouponByIdQuery,
  useSaveCouponMutation,
  useDeleteCouponMutation,
  useApplyCouponMutation,
} = couponAPISlice;
