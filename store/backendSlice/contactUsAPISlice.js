// contactUsAPISlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// ✅ Browser-safe basic auth header
const authHeader = username && password ? "Basic " + btoa(`${username}:${password}`) : "";

export const contactUsAPISlice = createApi({
  reducerPath: "contactUsAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/contact`,
    credentials: "include",
    prepareHeaders: (headers) => {
      if (authHeader) {
        headers.set("Authorization", authHeader);
      }
      return headers;
    },
  }),
  tagTypes: ["ContactUs"],
  endpoints: (builder) => ({
    // ✅ Fetch all leads
    getAllLeads: builder.query({
      query: () => `/all-leads`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ ContactID }) => ({
              type: "ContactUs",
              id: ContactID,
            })),
            { type: "ContactUs", id: "LIST" },
          ]
          : [{ type: "ContactUs", id: "LIST" }],
    }),

    // ✅ Save new enquiry
    saveEnquiry: builder.mutation({
      query: (formData) => ({
        url: `/save-enquiry`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "ContactUs", id: "LIST" }],
    }),

    updateLeadStatus: builder.mutation({
      query: ({ ContactID, LeadStatus, Remark }) => ({
        url: `/lead/${ContactID}/status`,
        method: "PATCH",
        body: { LeadStatus, Remark },
      }),
      invalidatesTags: (result, error, { ContactID }) => [
        { type: "ContactUs", id: ContactID },
        { type: "ContactUs", id: "LIST" },
      ],
    }),

    // ✅ Delete enquiry
    deleteEnquiry: builder.mutation({
      query: (ContactID) => ({
        url: `/delete-enquiry/${ContactID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, ContactID) => [
        { type: "ContactUs", id: ContactID },
        { type: "ContactUs", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllLeadsQuery,
  useSaveEnquiryMutation,
  useUpdateLeadStatusMutation,
  useDeleteEnquiryMutation,
} = contactUsAPISlice;
