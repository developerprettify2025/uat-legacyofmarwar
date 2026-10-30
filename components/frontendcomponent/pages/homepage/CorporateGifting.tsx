import Image from "next/image";
import Button from "../../atoms/Button";

export default function CorporateGifting() {
  return (
    <div className="banner corporate-gifting">
      <div className="bg">
        <video
          src="/video/gifting-banner.mp4"
          poster="/video/gifting-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        ></video>
        <div className="banner-wrapper">
          <div className="container">
            <div className="icon">
              <Image
                src="/icon/logo-vector.svg"
                width={43}
                height={37}
                alt="logo_icon"
              ></Image>
            </div>
            <div className="heading">
              <h2>Corporate Gifting, Elevated in Silver.</h2>
              <p>
                Timeless silver pieces crafted to complement her unique style
                and every special moment.
              </p>
            </div>
            <Button
              linkHref="/products"
              classname="animation"
              buttonText="Shop the collection"
              svgpath="/icon/logo-vector.svg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
