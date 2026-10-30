import Image from "next/image";
import Button from "../../atoms/Button";

export default function SilverStyle() {
  return (
    <section>
      <div className="silver_style">
        <div className="container">
          <div className="main_wrapper flex">
            <figure>
              <Image
                src="/images/about/silver-style.png"
                width={250}
                height={180}
                alt="silver-product"
              />
            </figure>
            <figcaption>
              <h6>Your Story. Your Silver. Your Style.</h6>
              <p>
                Explore our collections and find the pieces that speak to you
                timeless treasures designed to shine with every chapter of your
                life.
              </p>
              <Button
                classname="solid-primary"
                buttonText="Explore Our Collection"
                linkHref="/products"
                svgpath="/icon/btn-arrow.svg"
              />
            </figcaption>
          </div>
        </div>
      </div>
    </section>
  );
}
