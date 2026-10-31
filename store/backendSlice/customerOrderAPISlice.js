import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader =
  username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const customerOrderAPISlice = createApi({
  reducerPath: "customerOrderAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/customer-order`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["CustomerOrder", "OrderFormData", "OrderAddresses"],
  endpoints: (builder) => ({
    getAllCustomerOrders: builder.query({
      query: () => "/all-orders",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ CustomerOrderListID }) => ({
                type: "CustomerOrder",
                id: CustomerOrderListID,
              })),
              { type: "CustomerOrder", id: "LIST" },
            ]
          : [{ type: "CustomerOrder", id: "LIST" }],
    }),

    getOrderFormData: builder.query({
      query: () => "/form-data",
      providesTags: ["OrderFormData"],
    }),

    getCustomerOrderAddresses: builder.query({
      query: (customerID) => `/customer/${customerID}/addresses`,
      providesTags: (result, error, customerID) => [
        { type: "OrderAddresses", id: Number(customerID) },
      ],
    }),

    createCustomerOrder: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "CustomerOrder", id: "LIST" }],
    }),

    updateCustomerOrderStatus: builder.mutation({
      query: ({ OrderNo, ...payload }) => ({
        url: `/${OrderNo}/status`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [{ type: "CustomerOrder", id: "LIST" }],
    }),

    updateCustomerOrderPaymentStatus: builder.mutation({
      query: ({ OrderNo, ...payload }) => ({
        url: `/${OrderNo}/payment-status`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { OrderNo }) => [
        { type: "CustomerOrder", id: "LIST" },
        { type: "CustomerOrder", id: OrderNo },
      ],
    }),

    // Get orders customer-wise
    getCustomerOrders: builder.query({
      query: (customerID) => `/customer/${customerID}`,
      providesTags: (result, error, customerID) => [
        { type: "CustomerOrder", id: `CUSTOMER-${customerID}` },
      ],
    }),

    getCustomerOrderDetail: builder.query({
      query: ({ CustomerID, OrderNo }) => `customer-order/detail/${CustomerID}/${OrderNo}`,
    }),

    // Shiprocket Actions
    createShiprocketOrder: builder.mutation({
      query: (OrderNo) => ({
        url: `/${OrderNo}/shiprocket/create`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "CustomerOrder", id: "LIST" }],
    }),

    syncShiprocketOrders: builder.mutation({
      query: () => ({
        url: "/shiprocket/sync",
        method: "POST",
      }),
      invalidatesTags: [{ type: "CustomerOrder", id: "LIST" }],
    }),

    trackShiprocketOrder: builder.query({
      query: (OrderNo) => `/${OrderNo}/shiprocket/track`,
    }),
  }),
});

export const {
  useGetAllCustomerOrdersQuery,
  useGetOrderFormDataQuery,
  useGetCustomerOrderAddressesQuery,
  useCreateCustomerOrderMutation,
  useUpdateCustomerOrderStatusMutation,
  useUpdateCustomerOrderPaymentStatusMutation,
  useGetCustomerOrdersQuery,
  useGetCustomerOrderDetailQuery,
  // Shiprocket hooks
  useCreateShiprocketOrderMutation,
  useSyncShiprocketOrdersMutation,
  useTrackShiprocketOrderQuery,
} = customerOrderAPISlice;
