import Image from "next/image";

export default function DirectorMessage() {
  return (
    <section>
      <div className="director_message sec-pad-all">
        <div className="container">
          <div className="main_wrapper flex">
            <figure>
              <Image
                src="/images/about/founder.png"
                width={372}
                height={364}
                alt="director-img"
              />
            </figure>
            <figcaption>
              <h2>About the founder </h2>
              <div className="desc">
                <p>
                  Trishla is a proud daughter and the mother of two beautiful
                  children. Legacy of Marwar was founded on a belief she holds
                  close: some things are too beautiful to be put away.{" "}
                </p>
                <p>
                  The journey began with a love for silver she inherited from
                  her mother, and with the fine pieces her mother had set aside
                  over the years. Chokers, haslis and stone-set pieces, each
                  made with a care that is now rare, sat waiting for an
                  occasion. In them, Trishla saw a way of dressing she wanted to
                  bring back into daily life, with silver that belongs to every 
                  day, not just to the past. This inspirationation became an idea that is Legacy of Marwar.
                </p>
                <p>
                   
                  Her years as a Chartered Accountant taught her precision,
                  patience and respect for the details others overlook. Through
                  Legacy of Marwar, she brings the same discipline to every 
                  design. Each piece is handcrafted in 925 silver by skilled
                  karigars, so no two are exactly alike.
                </p>

                <p>
                  As a mother, she thinks often about what gets passed down.
                  Legacy of Marwar is her answer: jewellery made to be worn now
                  and kept for the next generation.
                </p>

                <p>
                  Our first collection, <em>Sandook</em>, is dedicated to every
                  woman who wears her heritage with pride and will one day pass
                  it on.
                </p>
              </div>
              <div className="designation">
                {/* <h6>Trisha</h6>
                <p>Director</p> */}
                <Image
                  className="director-sign"
                  src="/images/about/director-sign.svg"
                  width={135}
                  height={25}
                  alt="director-sign"
                />
              </div>
            </figcaption>
          </div>
        </div>

        <div className="tree">
          <Image
            src="/images/home/discover-tree.png"
            width={133}
            height={199}
            alt="tree"
          />
        </div>
      </div>
    </section>
  );
}
