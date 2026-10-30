import type { ReactNode } from "react";
import Button from "../atoms/Button";
import "@/uploads/sass/component/component.css";

interface AboutDescriptionProps {
  classname?: string;
  truck: boolean;
  mediaSrc?: string;
  heading: string;
  desc: string;
  ctaText: string;
  ctaHref: string;
  svgpath?: ReactNode;
}

const ctaIcon: ReactNode = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 25 25"
  >
    <path
      fill="currentColor"
      d="M18.92 6.05a.75.75 0 0 0-.598-.297L9.327 5.75a.75.75 0 1 0 0 1.5l7.19.002l-10.72 10.72a.75.75 0 0 0 1.061 1.06L17.573 8.318l.002 7.177a.75.75 0 0 0 1.5-.001l-.003-8.933a.75.75 0 0 0-.152-.51"
    />
  </svg>
);

export default function AboutDescription({
  classname = "",
  truck,
  mediaSrc,
  heading,
  desc,
  ctaText,
  ctaHref,
  svgpath,
}: AboutDescriptionProps) {
  return (
    <div className={`about_sec sec-pad-all ${classname}`}>
      <div className="container">
        <div className="main_wrapper flex">
          <div className="figure-animation">
            <div className="animation_wrapper">
              {truck ? (
                <>
                  <img src="/images/home/truck.png" className="truck" alt="" />
                  <div className="bottom_circle" />
                </>
              ) : (
                <video
                  src={mediaSrc}
                  width={100}
                  height={100}
                  playsInline
                  autoPlay
                  muted
                  loop
                ></video>
              )}
            </div>
          </div>
          <figcaption>
            <div className="heading">
              <h3>{heading}</h3>
              <div
                className="desc"
                dangerouslySetInnerHTML={{ __html: desc }}
              ></div>
              <Button
                linkHref={ctaHref}
                buttonText={ctaText}
                classname="solid-secondary"
                svgpath={svgpath}
              />
            </div>
          </figcaption>
        </div>
      </div>
    </div>
  );
}
