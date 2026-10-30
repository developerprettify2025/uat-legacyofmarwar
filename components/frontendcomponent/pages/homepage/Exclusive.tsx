"use client";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import Image from "next/image";
import Button from "../../atoms/Button";

interface ExclusiveProps {
  data: any[];
}
export default function Exclusive({ data }: ExclusiveProps) {
  return (
    <section>
      <div className="exclusive_sec sec-pad-all">
        <div className="container">
          <div className="main_wrapper flex">
            <div className="heading">
              <h2>Exclusive Silver</h2>
              <p>
                Discover thoughtfully crafted silver jewellery designed to add a
                touch of timeless elegance and distinctive charm to every
                occasion.
              </p>
              <div className="swiper-dots"></div>
            </div>
            <Swiper
              modules={[Pagination, Autoplay]}
              loop={true}
              className="exclusive_slider"
              speed={1500}
              autoplay={{
                delay: 1000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                el: ".swiper-dots",
                clickable: true,
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  spaceBetween: 10,
                },
                675: {
                  slidesPerView: 2,
                  spaceBetween: 10,
                },
                992: {
                  slidesPerView: 2.5,
                  spaceBetween: 0,
                },
              }}
            >
              {data.map((item) => (
                <SwiperSlide key={item.ProductID}>
                  <Link
                    href={`/${item.ProductNameURL}`}
                    className="exclusive_col"
                  >
                    <figure>
                      <Image
                        src={`/OnlineImages/ProductImages/${item.ProductImage}`}
                        width={280}
                        height={220}
                        alt={item.ProductNameURL}
                      ></Image>
                    </figure>
                    <figcaption>
                      <h6>{item.ProductName}</h6>
                      {item.ProductTagline && (
                        <p className="desc">{item.ProductTagline}</p>
                      )}
                      <Button
                        classname="solid-primary"
                        buttonText="Shop Now"
                        svgpath="/icon/btn-arrow.svg"
                      ></Button>
                    </figcaption>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
