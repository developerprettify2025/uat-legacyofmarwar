import Image from "next/image";
import Button from "../../atoms/Button";

export default function SilverStory() {
  return (
    <section>
      <div className="silver_sec sec-pad-all">
        <div className="container">
          <div className="heading">
            <h2>Silver That Tells a Story</h2>
          </div>
          <div className="main_wrapper">
            <figure>
              <Image
                src="/images/home/story-img.png"
                width={300}
                height={425}
                alt="story_img"
              />
            </figure>
            <div className="btn_wrap">
              <Button
                linkHref="/products"
                classname="primary-border"
                buttonText="Shop Now"
                svgpath="/icon/btn-arrow-prime.svg"
              />
            </div>
          </div>
        </div>
        <div className="camel">
          <Image
            src="/images/home/story-camel.png"
            width={127}
            height={175}
            alt="camel"
          ></Image>
        </div>
        <div className="peacock">
          <Image
            src="/images/home/story-peacock.png"
            width={300}
            height={390}
            alt="peacock"
          ></Image>
        </div>
      </div>
    </section>
  );
}
