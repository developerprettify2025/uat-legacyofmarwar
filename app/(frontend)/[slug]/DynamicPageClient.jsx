"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductDetailsPage from "@/components/frontendcomponent/pages/product-details";

export default function DynamicPageClient({meta, slug, initialData = null,}) {
  const router = useRouter();
  useEffect(() => {
    if (!meta) {
      router.replace("/something-went-wrong");
    }
  }, [meta, router]);

  if (!meta) {
    return null;
  }

  const pageType = meta?.type?.trim()?.toLowerCase();
  switch (pageType) {
    case "Product":
      return (
        <ProductDetailsPage
          slug={slug}
          initialData={initialData}
          meta={meta}
        />
      );

    case "project":
      return (
        <ProjectDetailsPage
          slug={slug}
          initialData={initialData}
          meta={meta}
        />
      );

    default:
      return (
        <RedirectToErrorPage router={router} />
      );
  }
}

function RedirectToErrorPage({ router }) {
  useEffect(() => {
    router.replace("/something-went-wrong");
  }, [router]);

  return null;
}