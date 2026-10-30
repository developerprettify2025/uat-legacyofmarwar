"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "@/uploads/sass/component/component.css";

interface ClientLogo {
  imgSrc: string;
}

export default function IndustryClients({
  classname = "",
  heading = "",
  subheading = "",
  clientsData = [],
}: {
  classname?: string;
  heading?: string;
  subheading?: string;
  clientsData?: ClientLogo[];
}) {
  return (
    <div className={`clients_sec sec-pad-all ${classname}`}>
      <div className="container">
        <div className="heading">
          <h3>{heading}</h3>
          {subheading && <p>{subheading}</p>}
        </div>
        <Swiper
          modules={[Autoplay]}
          className="clients_slider"
          loop={true}
          speed={3000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            0: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            675: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            991: {
              slidesPerView: 5,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 6,
              spaceBetween: 70,
            },
          }}
        >
          {clientsData.map((item, index) => (
            <SwiperSlide key={index}>
              <figure>
                <Image
                  src={item.imgSrc}
                  width={155}
                  height={90}
                  alt="client_logo"
                />
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
