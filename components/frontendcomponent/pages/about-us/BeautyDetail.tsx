"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import SwiperButton from "../../atoms/SwiperButton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function BeautyDetail() {
  return (
    <div className="beauty_details sec-pad-all">
      <div className="container-fluid">
        <div className="heading">
          <h3>Beauty in Every Detail</h3>
          <p>
            We believe true elegance lies in the details. From the delicate
            curves of a design to the finishing touches, every creation reflects
            our appreciation for beauty, individuality, and timeless style.
          </p>
        </div>
        <div className="main_wrapper">
          <Swiper
            modules={[Navigation, Pagination]}
            className="beauty_slider"
            speed={1000}
            navigation={{
              prevEl: ".beauty-prev",
              nextEl: ".beauty-next",
            }}
            pagination={{
              enabled: true,
              el: ".progressbar",
              type: "progressbar",
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
                spaceBetween: 20,
              },
              1336: {
                slidesPerView: 3.5,
                spaceBetween: 20,
              },
            }}
          >
            <SwiperSlide>
              <div className="beauty_col">
                <figure>
                  <Image
                    src="/images/about/beauty1.jpg"
                    width="480"
                    height="328"
                    alt="beauty-img"
                  ></Image>
                </figure>
                <figcaption>
                  <h6>Thoughtful Craftsmanship</h6>
                  <p>
                    Every design is thoughtfully created with attention to
                    detail and a passion for beautiful craftsmanship.
                  </p>
                </figcaption>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="beauty_col">
                <figure>
                  <Image
                    src="/images/about/beauty1.jpg"
                    width="480"
                    height="328"
                    alt="beauty-img"
                  ></Image>
                </figure>
                <figcaption>
                  <h6>Thoughtful Craftsmanship</h6>
                  <p>
                    Every design is thoughtfully created with attention to
                    detail and a passion for beautiful craftsmanship.
                  </p>
                </figcaption>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="beauty_col">
                <figure>
                  <Image
                    src="/images/about/beauty1.jpg"
                    width="480"
                    height="328"
                    alt="beauty-img"
                  ></Image>
                </figure>
                <figcaption>
                  <h6>Thoughtful Craftsmanship</h6>
                  <p>
                    Every design is thoughtfully created with attention to
                    detail and a passion for beautiful craftsmanship.
                  </p>
                </figcaption>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="beauty_col">
                <figure>
                  <Image
                    src="/images/about/beauty1.jpg"
                    width="480"
                    height="328"
                    alt="beauty-img"
                  ></Image>
                </figure>
                <figcaption>
                  <h6>Thoughtful Craftsmanship</h6>
                  <p>
                    Every design is thoughtfully created with attention to
                    detail and a passion for beautiful craftsmanship.
                  </p>
                </figcaption>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="beauty_col">
                <figure>
                  <Image
                    src="/images/about/beauty1.jpg"
                    width="480"
                    height="328"
                    alt="beauty-img"
                  ></Image>
                </figure>
                <figcaption>
                  <h6>Thoughtful Craftsmanship</h6>
                  <p>
                    Every design is thoughtfully created with attention to
                    detail and a passion for beautiful craftsmanship.
                  </p>
                </figcaption>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className="nav-wrapper swiper-nav primary">
          <SwiperButton classname="beauty-prev swiper-prev" />
          <div className="progressbar"></div>
          <SwiperButton classname="beauty-next swiper-next" />
        </div>
      </div>
    </div>
  );
}
