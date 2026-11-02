"use client";

import { useMemo } from "react";
import HeroBanner from "../../organisms/HeroBanner";
import ProductListingSlider from "../../organisms/ProductListingSlider";
// import Exclusive from "./Exclusive";
// import CorporateGifting from "./CorporateGifting";
import FollowSocialMedia from "./FollowSocialMedia";
// import DiscoverCategory from "./DiscoverCategory";
import FeaturedProduct from "./FeaturedProduct";
import "@/uploads/sass/home/home.css";

import {
  useGetHomePageDataQuery,
  useGetHeaderDataQuery,
} from "@/store/frontendSlice/homePageAPISlice";

import Loading from "@/app/loading";
import { useSelector } from "react-redux";
import SilverStory from "./SilverStory";
import SpecialOccasions from "./SpecialOccasions";



export default function HomePage() {
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

  const universaldata = headerData?.page || [];

  const pageInfo: Record<string, any> = Array.isArray(universaldata)
    ? (universaldata[0] ?? {})
    : universaldata;

  const products = homePageData?.products ?? [];
  const categories = homePageData?.categories ?? [];
  const onlyProducts = homePageData?.onlyProducts ?? [];
  const occasions = homePageData?.occasions ?? [];
  const homeProducts = homePageData?.homeProducts ?? [];
  const media = homePageData?.media ?? [];
  const categoryProductSections = useMemo(() => {
    const categories = new Map<string, any>();
    products.forEach((product: any) => {
      const categoryKey = String(product.CategoryID);
      if (!categories.has(categoryKey)) {
        categories.set(categoryKey, {
          CategoryID: product.CategoryID,
          CategoryName: product.CategoryName,
          CategoryNameURL: product.CategoryNameURL,
          CategoryVideo: product.CategoryVideo,
        });
      }
    });
    return Array.from(categories.values()).map((category: any, index) => ({
      classname: "discover_collection",
      heading:
        index === 0
          ? "Sandook - Our First Collection "
          : index === 1
            ? "Adaa - The Earring Collection"
            : `${category.CategoryName} Collection`,
      mediaSrc: "/images/home/collection.mp4",
      linkHref: "/products",
      tavNav: [
        {
          label: category.CategoryName,
          url: `/products/${category.CategoryNameURL}`,
          videoSrc: "/images/home/collection.mp4",
          productItem: products
            .filter(
              (product: any) =>
                String(product.CategoryID) === String(category.CategoryID),
            )
            .map((product: any) => ({
              sno: product.ProductID,
              ProductID: product.ProductID,
              CategoryID: product.CategoryID,
              linkHref: product.ProductNameURL
                ? `/${product.ProductNameURL}`
                : "/products",
              imgSrc: product.ProductImage
                ? `/OnlineImages/ProductImages/${product.ProductImage}`
                : "/images/other/ring1.png",
              imghoverSrc: product.ProductBannerImage4
                ? `/OnlineImages/ProductImages/${product.ProductBannerImage4}`
                : "/images/other/ring1.png",
              title: product.ProductName,
              sp: `₹ ${Number(product.ProductSalePrice ?? 0).toLocaleString(
                "en-IN",
              )}.00`,
              isWishlisted: Number(product.IsWishlisted ?? 0),
              itemID: Number(product.ItemID ?? 0),
              desc: product.ProductTagline ?? "",
            })),
        },
      ],
    }));
  }, [products]);

  const specialNewOccasionsData = useMemo(() => {
    const uniqueOccasions = Array.from(
      new Map(
        occasions.map((product: any) => [
          product.OccasionID,
          {
            OccasionID: product.OccasionID,
            OccasionName: product.OccasionName,
            OccasionURL: product.OccasionURL,
            OccasionImage: product.OccasionImage,
          },
        ]),
      ).values(),
    );

    return {
      classname: "special_listing",
      heading: "Special Occasions",
      mediaSrc: "/images/home/occasions.mp4",
      linkHref: "/product-listing",

      tavNav: uniqueOccasions.map((occasion: any) => ({
        label: occasion.OccasionName,
        url: `/products?occasion=${occasion.OccasionURL}`,

        videoSrc: occasion.OccasionImage
          ? `/OnlineImages/OccasionImages/${occasion.OccasionImage}`
          : "/images/home/occasions.mp4",

        productItem: occasions
          .filter(
            (product: any) =>
              String(product.OccasionID) === String(occasion.OccasionID),
          )
          .map((product: any) => ({
            sno: product.ProductID,
            ProductID: product.ProductID,
            linkHref: `/${product.ProductNameURL}`,

            imgSrc: product.ProductImage
              ? `/OnlineImages/ProductImages/${product.ProductImage}`
              : "/images/other/special1.png",
            imghoverSrc: product.ProductBannerImage4
              ? `/OnlineImages/ProductImages/${product.ProductBannerImage4}`
              : "/images/other/ring1.png",
            title: product.ProductName,

            sp: `₹ ${Number(product.ProductSalePrice ?? 0).toLocaleString(
              "en-IN",
            )}.00`,
            isWishlisted: Number(product.IsWishlisted ?? 0),
            itemID: Number(product.ItemID ?? 0),
            desc: product.ProductTagline,
          })),
      })),
    };
  }, [occasions]);

 const featuredProductData = useMemo(() => {
  return homeProducts.map((product: any) => ({
    sno: product.ProductID,
    ProductID: product.ProductID,
    CategoryID: product.CategoryID,
    CategoryName: product.CategoryName,
    CategoryNameURL: product.CategoryNameURL,
    ColorName: product.ColorName,

    linkHref: product.ProductNameURL
      ? `/${product.ProductNameURL}`
      : "/products",
    imgSrc: product.ProductImage
      ? `/OnlineImages/ProductImages/${product.ProductImage}`
      : "/images/other/ring1.png",
    imghoverSrc: product.ProductBannerImage4
      ? `/OnlineImages/ProductImages/${product.ProductBannerImage4}`
      : product.ProductImage
        ? `/OnlineImages/ProductImages/${product.ProductImage}`
        : "/images/other/ring1.png",
    title: product.ProductName,
    sp: `₹ ${Number(product.ProductSalePrice ?? 0).toLocaleString("en-IN")}.00`,
    isWishlisted: Number(product.IsWishlisted ?? 0),
    itemID: Number(product.ItemID ?? 0),
    desc: product.ProductTagline ?? "",
  }));
}, [homeProducts]);

const homeProductsByCategory = useMemo(() => {
  const uniqueCategories = Array.from(
    new Map(
      homeProducts.map((p: any) => [
        p.CategoryID,
        {
          CategoryID: p.CategoryID,
          CategoryName: p.CategoryName,
          CategoryNameURL: p.CategoryNameURL,
        },
      ]),
    ).values(),
  );

  return uniqueCategories.map((category: any) => ({
    label: category.CategoryName,
    url: `/products/${category.CategoryNameURL}`,

    productItem: featuredProductData.filter(
      (item: any) => String(item.CategoryID) === String(category.CategoryID),
    ),
  }));
}, [homeProducts, featuredProductData]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <main>Unable to load homepage data.</main>;
  }

  return (
    <main>
      <HeroBanner
        classname="home-hero-banner"
        subheading="Timeless Silver"
        heading="Modern Elegance"
        mediaSrc="/video/hero-banner-2.mp4"
        posterSrc="/video/hero-poster-1.png"
        linkHref="/products"
      />

      {categoryProductSections.map((section) => (
        <ProductListingSlider
          key={section.tavNav[0].label}
          data={section}
          isLegacy={false}
        />
      ))}

      {/* {categories.length > 0 && <DiscoverCategory data={categories} />} */}

      {featuredProductData.length > 0 && (
        <FeaturedProduct data={featuredProductData} />
      )}

      {/* {onlyProducts.length > 0 && <Exclusive data={onlyProducts} />} */}

      {/* <CorporateGifting /> */}

      <SilverStory />

      {specialNewOccasionsData.tavNav.length > 0 && (
        <SpecialOccasions data={specialNewOccasionsData} />
      )}

      {media.length > 0 && <FollowSocialMedia data={media} info={pageInfo} />}
    </main>
  );
}
