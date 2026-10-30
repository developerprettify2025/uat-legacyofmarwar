"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ListingCard from "../../molecules/ListingCard";
import SwiperButton from "../../atoms/SwiperButton";
import "swiper/css";
interface MoreProductsProps {
  relatedProducts: any;
}
export default function MoreProducts({ relatedProducts }: MoreProductsProps) {
  const productItem = (relatedProducts ?? []).map((item: any) => ({
    sno: item.ProductID,
    ProductID: item.ProductID,
    linkHref: `/${item.ProductNameURL}`,
    imgSrc: item.ProductImage
      ? `/OnlineImages/ProductImages/${item.ProductImage}`
      : "/images/other/ring1.png",
    imghoverSrc: item.ProductBannerImage4
      ? `/OnlineImages/ProductImages/${item.ProductBannerImage4}`
      : "/images/other/ring1.png",
    title: item.ProductName,
    sp: `₹ ${Number(item.ProductSalePrice ?? 0).toLocaleString("en-IN")}.00`,
    mrp: `₹ ${Number(item.ProductMRP ?? item.ProductSalePrice ?? 0).toLocaleString("en-IN")}.00`,
    isWishlisted: Number(item.IsWishlisted ?? 0),
    itemID: Number(item.ItemID ?? 0),
    // extra fields used only for filtering / sorting
    _price: Number(item.ProductSalePrice ?? 0),
    _category: item.CategoryName ?? "",
    _color: String(item.ColorName ?? "")
      .trim()
      .toLowerCase(),
    desc: item.ProductTagline,
  }));
  return (
    <section>
      <div className="more_products sec-pad-all">
        <div className="container-fluid">
          <div className="heading">
            <h2>You May Also Like</h2>
          </div>
          <div className="main_wrapper">
            <div className="swiper-nav center-full group secondary-border">
              <SwiperButton classname="swiper-prev more-prev"></SwiperButton>
              <SwiperButton classname="swiper-next more-next"></SwiperButton>
            </div>
            <Swiper
              modules={[Navigation]}
              className="more_slider"
              speed={1000}
              navigation={{
                prevEl: ".more-prev",
                nextEl: ".more-next",
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1.2,
                  spaceBetween: 10,
                },
                540: {
                  slidesPerView: 2,
                  spaceBetween: 10,
                },
                769: {
                  slidesPerView: 3,
                  spaceBetween: 10,
                },
                992: {
                  slidesPerView: 4,
                  spaceBetween: 15,
                },
              }}
            >
              {productItem.map((item: any) => (
                <SwiperSlide key={item.linkHref}>
                  <ListingCard data={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
