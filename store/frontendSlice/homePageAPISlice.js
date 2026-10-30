import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
function makeAuthHeader() {
  if (!username || !password) return "";
  const raw = `${username}:${password}`;
  if (typeof window === "undefined") {
    return "Basic " + Buffer.from(raw).toString("base64");
  }
  return "Basic " + btoa(raw);
}

const authHeader = makeAuthHeader();
export const homePageAPISlice = createApi({
  reducerPath: "homePageAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/homepage`,
    credentials: "include",

    prepareHeaders: (headers) => {
      if (authHeader) {
        headers.set("Authorization", authHeader);
      }

      return headers;
    },
  }),
  tagTypes: [
    "HomePage",
    "HeaderPage",
    "ProductSearch",
    "FooterPage",
    "ProductPage",
    "ProductDetislPage",
  ],
  endpoints: (builder) => ({
    // Homepage data with customer-specific wishlist status
    getHomePageData: builder.query({
      query: ({ CustomerID = 0 } = {}) => ({
        url: "/home-data",
        method: "GET",
        params: {
          CustomerID: Number(CustomerID) || 0,
        },
      }),
      providesTags: ["HomePage"],
    }),
    // Header data
    getHeaderData: builder.query({
      query: () => "/header-data",
      providesTags: ["HeaderPage"],
    }),
    // Footer data
    getFooterData: builder.query({
      query: () => "/footer-data",
      providesTags: ["FooterPage"],
    }),
    getProductData: builder.query({
      query: ({ CustomerID = 0 } = {}) => ({
        url: "/product-data",
        method: "GET",
        params: {
          CustomerID: Number(CustomerID) || 0,
        },
      }),
      providesTags: ["ProductPage"],
    }),
    // Product details: one object argument { ProductID, CustomerID }
    getProductDetails: builder.query({
      query: ({ ProductID, CustomerID = 0 }) => ({
        url: `/product-details/${ProductID}`,
        method: "GET",
        params: {
          CustomerID: Number(CustomerID) || 0,
        },
      }),
      providesTags: ["ProductDetislPage"],
    }),
    // Product search
    searchProducts: builder.query({
      query: (keyword) => ({
        url: "/search-products",
        method: "GET",
        params: { keyword },
      }),
      providesTags: ["ProductSearch"],
    }),
  }),
});

export const {
  useGetHomePageDataQuery,
  useGetHeaderDataQuery,
  useSearchProductsQuery,
  useGetFooterDataQuery,
  useGetProductDataQuery,
  useGetProductDetailsQuery,
} = homePageAPISlice;