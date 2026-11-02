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
          <li className="active">Necklace</li>
          <li>Earrings</li>
        </ul>
      </div>
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
