"use client";
import Image from "next/image";
import { useState, type MouseEventHandler } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Button from "../atoms/Button";
import "@/uploads/sass/component/component.css";

interface HeroProps {
  classname?: string;
  heading?: string;
  isLogo?: boolean;
  subheading?: string;
  desc?: string;
  mediaSrc: string | { image: string; title?: string; href?: string }[];
  posterSrc?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  linkHref?: string;
}

export default function HeroBanner({
  classname = "",
  heading = "",
  isLogo = false,
  subheading = "",
  desc = "",
  mediaSrc = "" as string | { image: string; title: string; href: string }[],
  posterSrc = "",
  onClick,
  linkHref = "",
}: HeroProps) {
  const resolvedSrc: string = Array.isArray(mediaSrc)
    ? (mediaSrc[0].image ?? "")
    : mediaSrc;

  const [activeSlide, setActiveSlide] = useState(0);
  const resolvedHref = Array.isArray(mediaSrc)
    ? (mediaSrc[activeSlide]?.href ?? linkHref)
    : linkHref;
  return (
    <div className={`banner hero_banner ${classname}`}>
      <div className="bg">
        {resolvedSrc.includes("mp4") ? (
          <video
            src={resolvedSrc}
            poster={posterSrc}
            width={1280}
            height={700}
            autoPlay
            muted
            loop
            playsInline
          ></video>
        ) : Array.isArray(mediaSrc) ? (
          <>
            <Swiper
              modules={[Autoplay]}
              spaceBetween={0}
              slidesPerView={1}
              speed={1200}
              allowTouchMove={false}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }}
              loop={true}
              className="banner-slider"
            >
              {mediaSrc?.map(({ image }, index) => {
                return (
                  <SwiperSlide key={index}>
                    <figure>
                      <Image
                        src={image}
                        alt="banner image"
                        width={1920}
                        height={1080}
                      />
                    </figure>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            <Swiper
              modules={[Autoplay]}
              direction="vertical"
              spaceBetween={0}
              slidesPerView={1}
              speed={1200}
              allowTouchMove={false}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }}
              loop={true}
              className="banner-content-slider"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              {mediaSrc?.map(({ title }, index) => {
                return (
                  <SwiperSlide key={index}>
                    <figcaption>
                      <h1>{title}</h1>
                    </figcaption>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </>
        ) : (
          <Image
            src={resolvedSrc}
            width={1280}
            height={700}
            alt={heading}
          ></Image>
        )}
        <div className="banner-wrapper">
          <div className="container">
            <div className="heading">
              {subheading && <h6>{subheading}</h6>}
              {heading && <h1>{heading}</h1>}
              {isLogo && (
                <Image
                  className="written-logo"
                  src="/images/about/logo-written.png"
                  width={540}
                  height={70}
                  alt="logo"
                ></Image>
              )}
              {desc && <p>{desc}</p>}
              {(onClick || resolvedHref) && (
                <Button
                  onClick={onClick}
                  linkHref={resolvedHref}
                  classname="animation"
                  buttonText="Shop the collection"
                  svgpath="/icon/logo-vector-old.svg"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
