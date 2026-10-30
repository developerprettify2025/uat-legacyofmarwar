import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function makeAuthHeader() {
  if (!username || !password) return "";
  const raw = `${username}:${password}`;
  if (typeof window === "undefined") {
    return "Basic " + Buffer.from(raw).toString("base64");
  } else {
    return "Basic " + btoa(raw);
  }
}

const authHeader = makeAuthHeader();

export const treatmentFrontendAPISlice = createApi({
  reducerPath: "treatmentFrontendAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/treatment`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) headers.set("Authorization", authHeader);
      return headers;
    },
  }),
  tagTypes: ["TreatmentFrontend"],
  endpoints: (builder) => ({
    getTreatmentBySlug: builder.query({
      query: (slug) => `/fetch-treatment/${slug}`,
      providesTags: (result, error, slug) => [{ type: "TreatmentFrontend", id: slug }],
    }),
  }),
});

export const {
  useGetTreatmentBySlugQuery,
} = treatmentFrontendAPISlice;
