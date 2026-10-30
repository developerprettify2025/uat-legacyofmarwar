import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader = username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const reportSummaryAPISlice = createApi({
  reducerPath: "reportSummaryAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/report`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) {
        headers.set("Authorization", authHeader);
      }
      return headers;
    },
  }),
  tagTypes: ["ReportSummary"],
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => `/admin-dashboard`,
      providesTags: ["ReportSummary"],
    }),
    getMonthWiseReport: builder.query({
      query: () => `/month-wise-report`,
      providesTags: ["ReportSummary"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetMonthWiseReportQuery,
} = reportSummaryAPISlice;
