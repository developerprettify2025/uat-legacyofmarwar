import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductListingPage from "@/components/frontendcomponent/pages/product-listing";
import { fetchMetaDataByUrl } from "@/store/frontendSlice/metaAPISlice";

export const dynamic = "force-dynamic";
const CANONICAL_URL = process.env.NEXT_PUBLIC_CANONICAL_URL ?? "http://localhost:6001";
const DEFAULT_TITLE = "Legacy Of Marwar | Products";
const DEFAULT_DESCRIPTION = "Explore our wide range of products at Legacy Of Marwar.";
const noindex = process.env.NEXT_PUBLIC_Index === "false";
const nofollow = process.env.NEXT_PUBLIC_follow === "false";

// Ek hi request: generateMetadata aur page dono isi ka result use karenge
const getMeta = cache(
  async (slug: string): Promise<any | null> => fetchMetaDataByUrl(slug),
);

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
    console.error("LOG: Meta fetch failed for PRODUCT LISTING PAGE:", error);

    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      alternates: {
        canonical: `${CANONICAL_URL}/products/${slug}`,
      },
      robots: {
        index: !noindex,
        follow: !nofollow,
      },
    };
  }

  // try/catch ke BAHAR, warna notFound() ka throw catch ho jata hai
  if (meta == null) {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
  };
}

  const title = meta.MetaTitle || DEFAULT_TITLE;
  const description = meta.MetaDescriptions || DEFAULT_DESCRIPTION;
  const keywords = meta.MetaKeywords || "";
  const canonical = `${CANONICAL_URL}/products/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
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
    icons: {
      icon: "/favicon.ico",
    },
  };
}


export default async function ProductListing({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getMeta(slug);

  if (result == null) {
    notFound();
  }

  const data = result;

  const ProductID = data.StaticID;
  const Heading = data.StaticName;
  const TagLine = data.SmallDescription;
  const Image = data.StaticImage
    ? `/OnlineImages/CategoryImages/${data.StaticImage}`
    : "";

  return (
    <ProductListingPage
      id={ProductID}
      heading={Heading}
      tagLine={TagLine}
      image={Image}
      url={slug}
    />
  );
}
