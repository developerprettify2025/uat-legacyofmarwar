import type { Metadata } from "next";
import BlogDetailsPage from "@/components/frontendcomponent/pages/blog-details";
import { fetchMetaDataByUrl } from "@/store/frontendSlice/metaAPISlice";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
const CANONICAL_URL = process.env.NEXT_PUBLIC_CANONICAL_URL ?? "http://localhost:6001";
const DEFAULT_TITLE = "Legacy Of Marwar | Blog";
const DEFAULT_DESCRIPTION = "Read the latest news, insights and updates from Legacy Of Marwar.";
const noindex = process.env.NEXT_PUBLIC_Index === "true";
const nofollow = process.env.NEXT_PUBLIC_follow === "true";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const meta = await fetchMetaDataByUrl(slug);
    const title = meta?.MetaTitle || DEFAULT_TITLE;
    const description = meta?.MetaDescriptions || DEFAULT_DESCRIPTION;
    const keywords = meta?.MetaKeywords || "";
    const canonical =`${CANONICAL_URL}/blogs/${slug}`;

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
        type: "article",
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
      "LOG: Meta fetch failed for BLOG DETAILS PAGE:",
      error
    );

    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,

      alternates: {
        canonical: `${CANONICAL_URL}/blogs/${slug}`,
      },

      robots: {
        index: !noindex,
        follow: !nofollow,
      },
    };
  }
}

export default async function BlogDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const meta = await fetchMetaDataByUrl(slug);
    if (meta?.type === "Blog") {
      return <BlogDetailsPage data={meta} slug={slug} />;
    }
    redirect("/something-went-wrong");
}