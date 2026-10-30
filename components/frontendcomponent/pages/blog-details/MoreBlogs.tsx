"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";

import SwiperButton from "../../atoms/SwiperButton";
import BlogCol from "../../molecules/BlogCol";

interface Blog {
  BlogID?: number;
  BlogName: string;
  BlogNameURL: string;
  BlogImage?: string | null;
  BlogBannerImage?: string | null;
  PostedDate?: string | Date | null;
}

interface MoreBlogsProps {
  data?: Blog[];
}

export default function MoreBlogs({ data = [] }: MoreBlogsProps) {
  const blogsData = data.map((blog) => ({
    linkHref: `/blogs/${blog.BlogNameURL}`,
    mediaSrc: blog.BlogImage
      ? `/OnlineImages/BlogImages/${(
          blog.BlogImage || blog.BlogBannerImage || ""
        ).replace(/^\//, "")}`
      : "/images/other/gallery1.jpg",
    title: blog.BlogName,
    date: blog.PostedDate
      ? new Date(blog.PostedDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "",
  }));

  if (blogsData.length === 0) return null;

  return (
    <div className="more_blogs_sec sec-pad-all">
      <div className="container">
        <div className="heading">
          <h2>More Blogs</h2>
        </div>

        <div className="main_wrapper">
          <div className="swiper-nav center-full group white">
            <SwiperButton classname="swiper-prev more-prev">
              </SwiperButton>
            <SwiperButton classname="swiper-next more-next">
              </SwiperButton>
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
              675: {
                slidesPerView: 2,
                spaceBetween: 15,
              },
              992: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
            }}
          >
            {blogsData.map((item, index) => (
              <SwiperSlide key={item.linkHref || index}>
                <BlogCol data={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}