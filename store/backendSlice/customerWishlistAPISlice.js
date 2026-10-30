import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const customerWishlistAPISlice = createApi({
  reducerPath: "customerWishlistAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/customer-wishlist`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["CustomerWishlist"],
  endpoints: (builder) => ({
    getAllCustomerWishlists: builder.query({
      query: () => "/all-wishlists",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ CustomerWishlistID }) => ({
                type: "CustomerWishlist",
                id: CustomerWishlistID,
              })),
              { type: "CustomerWishlist", id: "ADMIN-LIST" },
            ]
          : [{ type: "CustomerWishlist", id: "ADMIN-LIST" }],
    }),
    getCustomerWishlist: builder.query({
      query: (customerID) => `/customer/${customerID}`,
      providesTags: (result, error, customerID) => [
        { type: "CustomerWishlist", id: `CUSTOMER-${customerID}` },
      ],
    }),
    addProductToWishlist: builder.mutation({
      query: ({ CustomerID, ProductID, UpdatedBy }) => ({
        url: "/",
        method: "POST",
        body: { CustomerID, ProductID, UpdatedBy },
      }),
      invalidatesTags: (result, error, { CustomerID }) => [
        { type: "CustomerWishlist", id: `CUSTOMER-${CustomerID}` },
        { type: "CustomerWishlist", id: "ADMIN-LIST" },
      ],
    }),
    removeProductFromWishlist: builder.mutation({
      query: ({ CustomerID, ProductID }) => ({
        url: `/customer/${CustomerID}/product/${ProductID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { CustomerID }) => [
        { type: "CustomerWishlist", id: `CUSTOMER-${CustomerID}` },
        { type: "CustomerWishlist", id: "ADMIN-LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllCustomerWishlistsQuery,
  useGetCustomerWishlistQuery,
  useAddProductToWishlistMutation,
  useRemoveProductFromWishlistMutation,
} = customerWishlistAPISlice;
