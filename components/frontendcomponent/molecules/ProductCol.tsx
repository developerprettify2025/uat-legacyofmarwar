import Image from "next/image";
import Link from "next/link";

interface ProductCol {
  linkHref: string;
  imgSrc: string;
  title: string;
  desc: string;
}

interface ProductColProps {
  data: ProductCol;
}

export default function ProductCol({ data }: ProductColProps) {
  const { linkHref = "#", imgSrc = "", title = "", desc = "" } = data;
  return (
    <Link href={linkHref} className="item-md product_col">
      <figure>
        {imgSrc && <Image src={imgSrc} width={290} height={366} alt={title} />}
      </figure>
      <figcaption>
        <h6>{title}</h6>
        <p>{desc}</p>
      </figcaption>
    </Link>
  );
}
