import Image from "next/image";
import Button from "../atoms/Button";
import "@/uploads/sass/component/component.css";

interface SocialProps {
  img: string;
  heading: string;
  desc: string;
  linkHref: string;
}

interface SocialData {
  data: SocialProps;
}

export default function SocialCol({ data }: SocialData) {
  return (
    <div className="social_col item-md">
      <figure>
        <Image src={data.img} width={380} height={410} alt="Social_img" />
      </figure>
      <figcaption>
        <h6>{data.heading}</h6>
        <div className="desc">
          <p>{data.desc}</p>
        </div>
        <Button
          linkHref={data.linkHref}
          classname="solid-secondary"
          buttonText="Read More"
        ></Button>
      </figcaption>
    </div>
  );
}
