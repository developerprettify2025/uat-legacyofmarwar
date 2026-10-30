import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailsPage from "@/components/frontendcomponent/pages/product-details";
import { fetchMetaDataByUrl } from "@/store/frontendSlice/metaAPISlice";

export const dynamic = "force-dynamic";

const CANONICAL_URL =
  process.env.NEXT_PUBLIC_CANONICAL_URL ?? "http://localhost:6001";
const DEFAULT_TITLE = "Legacy Of Marwar";
const DEFAULT_DESCRIPTION =
  "Legacy Of Marwar is a leading mining and infrastructure services company providing end-to-end solutions across mining, construction and industrial sectors.";

// Ek hi request: generateMetadata aur page dono isi ka result use karenge
const getMeta = cache(async (slug: string) => {
  try {
    return await fetchMetaDataByUrl(slug);
  } catch (error: any) {
    // slice wala fix na laga ho tab bhi 404 pakad lo
    if (String(error?.message).includes("status: 404")) return null;
    throw error; // baaki errors (500, network) alag handle honge
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let meta: any = null;
  try {
    meta = await getMeta(slug);
  } catch (error) {
    // server error: default metadata, page crash nahi hoga
    console.error("LOG: Meta fetch failed for DYNAMIC PAGE:", error);
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      alternates: { canonical: `${CANONICAL_URL}/${slug}` },
    };
  }

  // try/catch ke BAHAR, warna notFound() ka throw catch ho jata hai
  if (!meta) notFound();

  const title = meta.MetaTitle || DEFAULT_TITLE;
  const description = meta.MetaDescriptions || DEFAULT_DESCRIPTION;
  const keywords = meta.MetaKeywords || "";
  const canonical = `${CANONICAL_URL}/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Legacy Of Marwar",
      images: [
        {
          url: `${CANONICAL_URL}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${CANONICAL_URL}/images/og-image.jpg`],
    },
    icons: { icon: "/favicon.ico" },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getMeta(slug);

  if (!meta) notFound();

  return <ProductDetailsPage meta={meta} slug={slug} />;
}