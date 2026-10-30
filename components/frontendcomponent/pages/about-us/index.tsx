"use client";
import { useMemo } from "react";
import HeroBanner from "../../organisms/HeroBanner";
import BeautyDetail from "./BeautyDetail";
import DirectorMessage from "./DirectorMessage";
import OurStory from "./OurStory";
import SilverStyle from "./SilverStyle";
import "@/uploads/sass/about/about.css";
import { useSelector } from "react-redux";
import ProductListingSlider from "../../organisms/ProductListingSlider";
import {
  useGetHomePageDataQuery,
  useGetHeaderDataQuery,
} from "@/store/frontendSlice/homePageAPISlice";

export default function AboutUsPage() {
  const {
    user,
    isLoggedIn = false,
    accounts = [],
  } = useSelector((state: any) => state.auth ?? {});
  const CustomerID = Number(
    user?.CustomerID ??
      user?.customerID ??
      user?.CustomerId ??
      accounts?.[0]?.CustomerID ??
      accounts?.[0]?.customerID ??
      accounts?.[0]?.CustomerId ??
      0,
  );
  console.log("Final CustomerID:", CustomerID);
  const { data: headerData } = useGetHeaderDataQuery(undefined);
  const {
    data: homePageData,
    isLoading,
    error,
  } = useGetHomePageDataQuery(
    { CustomerID },
    { refetchOnMountOrArgChange: true },
  );
  const products = homePageData?.products ?? [];
  const discoverCollectionData = useMemo(() => {
    const uniqueCategories = Array.from(
      new Map(
        products.map((product: any) => [
          product.CategoryID,
          {
            CategoryID: product.CategoryID,
            CategoryName: product.CategoryName,
            CategoryNameURL: product.CategoryNameURL,
            CategoryVideo: product.CategoryVideo,
          },
        ]),
      ).values(),
    );

    return {
      classname: "discover_collection",
      heading: "Sandook - Our First Collection",
      mediaSrc: "/images/home/collection.mp4",
      linkHref: "/products",

      tavNav: uniqueCategories.map((category: any) => ({
        label: category.CategoryName,
        url: `/products/${category.CategoryNameURL}`,

        videoSrc: category.CategoryVideo
          ? `/OnlineImages/CategoryImages/${category.CategoryVideo}`
          : "/images/home/collection.mp4",

        productItem: products
          .filter(
            (product: any) =>
              String(product.CategoryID) === String(category.CategoryID),
          )
          .map((product: any) => ({
            sno: product.ProductID,
            ProductID: product.ProductID,
            linkHref: `/${product.ProductNameURL}`,

            imgSrc: product.ProductImage
              ? `/OnlineImages/ProductImages/${product.ProductImage}`
              : "/images/other/ring1.png",
            imghoverSrc: product.ProductBannerImage4
              ? `/OnlineImages/ProductImages/${product.ProductBannerImage4}`
              : "/images/other/ring1.png",
            title: product.ProductName,

            sp: `INR ${Number(product.ProductSalePrice ?? 0).toLocaleString(
              "en-IN",
            )}`,
            isWishlisted: Number(product.IsWishlisted ?? 0),
            itemID: Number(product.ItemID ?? 0),
            desc: product.ProductTagline,
          })),
      })),
    };
  }, [products]);

  return (
    <main>
      <HeroBanner
        classname="about-hero-banner"
        isLogo={true}
        desc="Crafting timeless elegance, one silver story at a time."
        mediaSrc="/images/about/hero-banner.jpg"
        // posterSrc="/video/about-poster.jpg"
      />
      <OurStory />
      {/* <BeautyDetail /> */}
      <DirectorMessage />
      {discoverCollectionData.tavNav.length > 0 && (
        <ProductListingSlider isLegacy={false} data={discoverCollectionData} />
      )}
      {/* <SilverStyle /> */}
    </main>
  );
}
