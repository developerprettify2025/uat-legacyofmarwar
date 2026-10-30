import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const customerShippingAddressAPISlice = createApi({
  reducerPath: "customerShippingAddressAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/customer-shipping-address`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["CustomerShippingAddress"],
  endpoints: (builder) => ({
    getCustomerShippingAddresses: builder.query({
      query: (customerID) => `/${customerID}`,
      providesTags: (result, error, customerID) => [
        { type: "CustomerShippingAddress", id: `CUSTOMER-${customerID}` },
      ],
    }),
    saveCustomerShippingAddress: builder.mutation({
      query: (address) => ({
        url: "/",
        method: "POST",
        body: address,
      }),
      invalidatesTags: (result, error, address) => [
        {
          type: "CustomerShippingAddress",
          id: `CUSTOMER-${address.CustomerID}`,
        },
      ],
    }),
    deleteCustomerShippingAddress: builder.mutation({
      query: ({ CustomerID, CustomerShippingAddressID }) => ({
        url: `/${CustomerID}/${CustomerShippingAddressID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { CustomerID }) => [
        { type: "CustomerShippingAddress", id: `CUSTOMER-${CustomerID}` },
      ],
    }),
  }),
});

export const {
  useGetCustomerShippingAddressesQuery,
  useSaveCustomerShippingAddressMutation,
  useDeleteCustomerShippingAddressMutation,
} = customerShippingAddressAPISlice;
