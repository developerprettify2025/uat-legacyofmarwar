"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
interface DiscoverCategoryProps {data: any[];}
export default function DiscoverCategory({data, }: DiscoverCategoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  useGSAP(
    () => {
      const total = data.length;
      const getHeaderHeight = () =>
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--headerfixed",
          ),
        ) || 0;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: () => `top top+=${getHeaderHeight()}`,
        end: `+=${total * 100}%`, // 100vh of scroll per category
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const index = Math.min(total - 1, Math.floor(self.progress * total));
          setActiveIndex(index); // no re-render if the value is unchanged
        },
      });
    },
    { scope: sectionRef },
  );

  const getColClass = (index: number) => {
    if (index === activeIndex) return "category_col active";
    if (index < activeIndex) return "category_col exit";
    return "category_col";
  };

  return (
    <section ref={sectionRef}>
      <div className="discover_category sec-pad-all">
        <div className="heading">
          <h2>Discover by Category</h2>
        </div>
        <div className="main_wrapper">
          <div className="category_wrapper">
            {data.map((item, index) => (
              <Link
                key={item.CategoryNameURL}
                className={getColClass(index)}
                href={`/products/${item.CategoryNameURL}`}
              >
                <figure>
                  <Image
                    src={`/OnlineImages/CategoryImages/${item.CategoryImage}`}
                    width={450}
                    height={500}
                    alt={item.CategoryNameURL}
                  />
                </figure>
              </Link>
            ))}
          </div>
          <ul className="category_nav">
            {data.map((item, index) => (
              <li
                key={item.CategoryName}
                className={index === activeIndex ? "active" : ""}
              >
                {item.CategoryName}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
