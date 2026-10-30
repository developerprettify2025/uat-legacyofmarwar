import Image from "next/image";
import Link from "next/link";

type FeaturedProductItem = {
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
  return (
    <section className="home-featured-product">
      <div className="grid">
        {data?.map(({ linkHref, imgSrc, title, desc }) => {
          return (
            <Link className="featured-card" href={linkHref} key={linkHref}>
              <Image src={imgSrc} alt={title} width={1200} height={1200} />
              <figcaption>
                <h3>{title}</h3>
                <p>{desc}</p>
              </figcaption>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
