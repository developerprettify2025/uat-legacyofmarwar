//metaAPISlice.tsx
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


export const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${apiUrl}/page`,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (authHeader) headers.set("Authorization", authHeader);
    return headers;
  },
});


export interface MetaDataType {
  StaticID: number;
  MetaTitle: string;
  MetaDescriptions: string;
  MetaKeywords: string;
  type?: string;
  [key: string]: any;
}


export const metaAPISlice = createApi({
  reducerPath: "metaAPI",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Static"],
  endpoints: (builder) => ({
    getMetaDataById: builder.query<MetaDataType, number>({
      query: (id) => `/meta_data/${id}`,
      providesTags: (result, error, id) => [{ type: "Static", id }],
    }),
    getMetaDataByUrl: builder.query<MetaDataType, string>({
      query: (url) => `/meta_data_by_url/${encodeURIComponent(url)}`,
      providesTags: (result, error, url) => [{ type: "Static", id: url }],
    }),
  }),
});

export const {
  useGetMetaDataByIdQuery,
  useGetMetaDataByUrlQuery,
} = metaAPISlice;

export async function fetchMetaDataById(id: number): Promise<MetaDataType> {
  const res = await baseQueryWithAuth(
    { url: `/meta_data/${id}`, method: "GET" },
    {} as any,
    {}
  );
  if ("error" in res) {
    throw new Error(
      `Meta API by ID failed (status: ${(res.error as any)?.status ?? "UNKNOWN"}) → ${(res.error as any)?.error || "Unknown error"
      }`
    );
  }
  const payload = res.data as { success: boolean; data?: MetaDataType };
  if (!payload?.success || !payload.data) {
    throw new Error(`Meta API returned empty/failed result for ID: ${id}`);
  }

  return payload.data;
}

export async function fetchMetaDataByUrl(
  url: string
): Promise<MetaDataType | null> {
  const res = await baseQueryWithAuth(
    { url: `/meta_data_by_url/${encodeURIComponent(url)}`, method: "GET" },
    {} as any,
    {}
  );

  if (res.error) {
    const status = (res.error as any)?.status ?? "UNKNOWN_STATUS";

    // purana backend 404 deta ho tab bhi: slug nahi mila -> null
    if (status === 404) return null;

    const message =
      (res.error as any)?.data?.message ||
      (res.error as any)?.error ||
      "Unknown error";
    throw new Error(
      `Meta API request failed (status: ${status}) → ${message} for url: ${url}`
    );
  }

  if (!res.data || typeof res.data !== "object") {
    throw new Error(`Meta API returned non-JSON response for url: ${url}`);
  }

  const payload = res.data as {
    success: boolean;
    found?: boolean;
    data?: MetaDataType | null;
  };

  // slug DB me nahi hai -> error nahi, null (page.tsx notFound() dikhayega)
  if (payload.found === false || (payload.success && !payload.data)) {
    return null;
  }

  // success false aur found bhi nahi bataya -> asli failure
  if (!payload.success || !payload.data) {
    throw new Error("Meta API returned empty or failed result");
  }

  return payload.data;
}
