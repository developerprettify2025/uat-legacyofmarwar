import type { Metadata } from "next";
//import PrivacyPolicyPage from "@/components/frontendcomponent/pages/privacy-policy";
import { fetchMetaDataById } from "@/store/frontendSlice/metaAPISlice";
export const dynamic = "force-dynamic";
const API_ID = 15;
const CANONICAL_URL = process.env.NEXT_PUBLIC_CANONICAL_URL ?? "http://localhost:6001";
const DEFAULT_TITLE = "Legacy Of Marwar";
const DEFAULT_DESCRIPTION = "--";
export async function generateMetadata(): Promise<Metadata> {
  try {
    const meta = await fetchMetaDataById(API_ID);
    const title = meta?.MetaTitle || DEFAULT_TITLE;
    const description = meta?.MetaDescriptions || DEFAULT_DESCRIPTION;
    const keywords = meta?.MetaKeywords || "";
    return {
      title,
      description,
      keywords,

      alternates: {
        canonical: CANONICAL_URL,
      },
      openGraph: {
        type: "website",
        url: CANONICAL_URL,
        title,
        description,
        siteName: "Legacy Of Marwar",
        images: [
          {
            url: `${CANONICAL_URL}/images/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: "Legacy Of Marwar",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          `${CANONICAL_URL}/images/og-image.jpg`,
        ],
      },
      icons: {
        icon: "/favicon.ico",
      },
    };
  } catch (error) {
    console.error(
      "LOG: Meta fetch failed for HOME PAGE:",
      error
    );

    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,

      alternates: {
        canonical: CANONICAL_URL,
      },
    };
  }
}
export default function Home() {
  return <></>;
  //return <PrivacyPolicyPage />;
}