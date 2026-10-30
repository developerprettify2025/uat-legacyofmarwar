"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
//import type { Category } from "@/app/types/product";
import SwiperButton from "../atoms/SwiperButton";
import Button from "../atoms/Button";
import ListingCard from "../molecules/ListingCard";
import ProductCol from "../molecules/ProductCol";
import Image from "next/image";

interface ProductItem {
  sno: string;
  linkHref: string;
  imgSrc: string;
  desc: string;
  imghoverSrc?: string;
  title: string;
  sp?: string;
  mrp?: string;
  isWishlisted?: string;
  itemID?: string;
}

interface SliderCategory {
  label: string;
  url?: string;
  videoSrc?: string;
  productItem: ProductItem[];
}

interface ProductData {
  classname?: string;
  heading: string;
  mediaSrc: string;
  linkHref: string;
  tavNav: SliderCategory[];
}

interface ProductProps {
  data: ProductData;
  isLegacy?: boolean;
}

export default function ProductListingSlider({
  data,
  isLegacy = true,
}: ProductProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCategory = data.tavNav?.[activeIndex];
  const productItems = activeCategory?.productItem ?? [];

  if (!data.tavNav?.length) {
    return null;
  }

  return (
    <section>
      <div
        className={`product_listing_slider sec-pad-all ${data.classname ?? ""}`}
      >
        <div className="container">
          <div className="upper_sec">
            {data.classname === "special_listing" && (
              <div className="peacock">
                <Image
                  src="/images/home/special-peacock.png"
                  width={110}
                  height={100}
                  alt="peacock"
                  unoptimized
                />
              </div>
            )}
            <div className="heading">
              <h2 dangerouslySetInnerHTML={{ __html: data.heading }}></h2>
            </div>
            {data.tavNav.length > 1 ? (
              <ul className="tab-nav">
                {data.tavNav.map((item, index) => (
                  <li
                    key={item.label}
                    className={index === activeIndex ? "active" : ""}
                    onClick={() => setActiveIndex(index)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="main_wrapper">
            <figure className="display_media">
              <video
                key={activeCategory?.videoSrc || data.mediaSrc}
                src={activeCategory?.videoSrc || data.mediaSrc}
                autoPlay
                muted
                loop
                playsInline
              />
            </figure>

            <div className="slider_section">
              <div className="swiper-nav center-full group secondary-border">
                <SwiperButton classname="swiper-prev product-prev" />
                <SwiperButton classname="swiper-next product-next" />
              </div>

              <Swiper
                key={activeIndex}
                modules={[Navigation]}
                className="product_slider"
                speed={1000}
                navigation={{
                  prevEl: ".product-prev",
                  nextEl: ".product-next",
                }}
                breakpoints={{
                  0: {
                    slidesPerView: 1.2,
                    spaceBetween: 10,
                  },
                  540: {
                    slidesPerView: 1,
                    spaceBetween: 10,
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 10,
                  },
                  992: {
                    slidesPerView: 3,
                    spaceBetween: 12,
                  },
                }}
              >
                {productItems.map((item, index) => (
                  <SwiperSlide key={`${item.linkHref}-${index}`}>
                    <ProductCol data={item} />
                    {/* <ListingCard data={item} /> */}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          <div className="btn_wrap">
            <Button
              classname="primary-border"
              buttonText="Explore All"
              linkHref={activeCategory?.url || data.linkHref}
              svgpath="/icon/btn-arrow-prime.svg"
            />
          </div>

          {data.classname === "discover_collection" && isLegacy && (
            <div className="subheading">
              <div className="icon">
                <Image
                  src="/images/home/discover-elephant.png"
                  width={112}
                  height={102}
                  alt="elephant"
                  unoptimized
                />
              </div>
              <h4>A Marwar Elegance</h4>
              {/* Legacy of  */}
            </div>
          )}
          {data.classname === "discover_collection" && isLegacy && (
            <div className="tree">
              <Image
                src="/images/home/discover-tree.png"
                width={150}
                height={225}
                alt="tree"
              />
            </div>
          )}
          {data.classname === "special_listing" && (
            <div className="door">
              <Image
                src="/images/home/door-special.png"
                width={160}
                height={360}
                alt="tree"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
