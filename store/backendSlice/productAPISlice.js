import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const authHeader = username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const productAPISlice = createApi({
  reducerPath: "productAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/product`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: () => `/all-products`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ ProductID }) => ({ type: "Product", id: ProductID })),
            { type: "Product", id: "LIST" },
          ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProductById: builder.query({
      query: (id) => `/fill-product-data?ProductID=${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    saveOrUpdateProduct: builder.mutation({
      query: (formData) => ({
        url: `/save-or-update-product`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Product", id: "LIST" },
        ...(result?.ProductID
          ? [{ type: "Product", id: Number(result.ProductID) }]
          : []),
      ],
    }),
    deleteProduct: builder.mutation({
      query: (ProductID) => ({
        url: `/delete-product/${ProductID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, ProductID) => [
        { type: "Product", id: ProductID },
        { type: "Product", id: "LIST" },
      ],
    }),
    updateDisplayOrder: builder.mutation({
      query: (data) => ({
        url: `/update-display-order`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    getMaxDisplayOrder: builder.query({
      query: () => `/max-display-order`,
      providesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProductStatus: builder.mutation({
      query: ({ ProductID, ActiveStatus }) => ({
        url: `/update-status`,
        method: "POST",
        body: { ProductID, ActiveStatus },
      }),
      invalidatesTags: (result, error, { ProductID }) => [
        { type: "Product", id: ProductID },
      ],
    }),
    getAllActiveProducts: builder.query({
      query: () => `/products`,
      providesTags: [{ type: "Product", id: "LIST" }],
    }),
    getProductBySlug: builder.query({
      query: (slug) => `/fetch-product/${slug}`,
      providesTags: (result, error, slug) => [
        { type: "Product", id: slug },
        { type: "Product", id: "LIST" },
      ],
    }),

  }),
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useSaveOrUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateDisplayOrderMutation,
  useGetMaxDisplayOrderQuery,
  useUpdateProductStatusMutation,
  useGetAllActiveProductsQuery,
  useGetProductBySlugQuery,
} = productAPISlice;
