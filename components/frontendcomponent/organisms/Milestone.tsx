"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "@/uploads/sass/component/component.css";

interface milestone {
  img: string;
  year: number;
  number: string;
  heading: string;
  desc: string;
}

interface milestoneProps {
  classname?: string;
  milestoneData?: milestone[];
}

export default function Milestone({
  classname = "",
  milestoneData = [],
}: milestoneProps) {
  return (
    <div className={`milestones_sec sec-pad-all ${classname}`}>
      <div className="heading">
        <h3>Milestones</h3>
      </div>
      <Swiper
        className="milestone_slider"
        speed={1500}
        breakpoints={{
          0: {
            slidesPerView: 1.2,
            spaceBetween: 15,
          },
          540: {
            slidesPerView: 2,
            spaceBetween: 15,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 15,
          },
          991: {
            slidesPerView: 4,
            spaceBetween: 0,
          },
          1440: {
            slidesPerView: "auto",
            spaceBetween: 0,
          },
        }}
      >
        {milestoneData.map((item) => (
          <SwiperSlide key={item.year}>
            <div className="milestone_col">
              <figure>
                <img src={item.img} alt="milestone_img" />
              </figure>
              <span className="year">{item.year}</span>
              <div className="number">
                <span>{item.number}</span>
              </div>
              <div className="desc">
                <h6>{item.heading}</h6>
                <p>{item.desc}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
