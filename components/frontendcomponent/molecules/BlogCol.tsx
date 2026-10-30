import Image from "next/image";
import Link from "next/link";

interface BlogItem {
  linkHref: string;
  mediaSrc: string;
  title: string;
  date: string;
}

interface BlogData {
  data: BlogItem;
}

export default function BlogCol({ data }: BlogData) {
  const { linkHref = "", mediaSrc = "", title = "", date = "" } = data;
  return (
    <Link className="blogs_col" href={linkHref}>
      <figure>
        <Image src={mediaSrc} width={375} height={254} alt="blogs_img" unoptimized></Image>
      </figure>
      <figcaption>
        <h6>{title}</h6>
        <p>{date}</p>
      </figcaption>
    </Link>
  );
}
