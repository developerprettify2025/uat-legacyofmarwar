"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type FeaturedProductItem = {
  ProductID: number;
  CategoryID: number;
  CategoryName: string;
  CategoryNameURL: string;
  linkHref: string;
  imgSrc: string;
  title: string;
  desc: string;
};

export default function FeaturedProduct({
  data = [],
}: {
  data: FeaturedProductItem[];
}) {
  const categories = useMemo(() => {
    return Array.from(
      new Map(
        data.map((item) => [
          item.CategoryID,
          {
            CategoryID: item.CategoryID,
            CategoryName: item.CategoryName,
          },
        ]),
      ).values(),
    );
  }, [data]);
  const [selectedCategoryID, setSelectedCategoryID] = useState<number | null>(
    null,
  );

  const activeCategoryID = selectedCategoryID ?? categories[0]?.CategoryID;
  const filteredProducts = useMemo(() => {
    return data.filter(
      (item) => String(item.CategoryID) === String(activeCategoryID),
    );
  }, [data, activeCategoryID]);

  return (
    <section className="home-featured-product">
      <div className="upper_sec">
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
        </div>
        <div className="tree">
          <Image
            src="/images/home/discover-tree.png"
            width={150}
            height={225}
            alt="tree"
          />
        </div>

        <ul className="tab-nav">
          {categories.map((category) => (
            <li
              key={category.CategoryID}
              className={
                String(category.CategoryID) === String(activeCategoryID)
                  ? "active"
                  : ""
              }
              onClick={() => setSelectedCategoryID(category.CategoryID)}
            >
              {category.CategoryName}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid">
        {filteredProducts.map(({ ProductID, linkHref, imgSrc, title, desc }) => (
          <Link className="featured-card" href={linkHref} key={ProductID}>
            <Image src={imgSrc} alt={title} width={1200} height={1200} />
            <figcaption>
              <h3>{title}</h3>
              <p>{desc}</p>
            </figcaption>
          </Link>
        ))}
      </div>
    </section>
  );
}