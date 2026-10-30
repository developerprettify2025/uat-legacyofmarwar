import Image from "next/image";

export default function OurStory() {
  return (
    <section>
      <div className="our-story sec-pad-all">
        <div className="container">
          <div className="upper_sec">
              <div className="peacock">
                <Image
                  src="/images/home/special-peacock.png"
                  width={110}
                  height={100}
                  alt="peacock"
                  unoptimized
                />
              </div>
            <div className="heading">
              <h2>Our Story</h2>
            </div>
          </div>

          <div className="main_wrapper flex">
            <figure>
                <Image
                  src="/images/about/hand-picked.png"
                  width={446}
                  height={594}
                  alt="our-story"
                />
            </figure>
            <figcaption>
              <div className="heading">
                <h3>It started in a drawer.</h3>
              </div>
              <div className="desc">
                <p>
                  A regular evening of bonding with my mother and I was curiously sifting though her jewellery drawer. I found silver I had never seen her wear: chokers, delicate stone work, haslis with the kind of detail that takes patience to make. These were beautifully crafted pieces each carrying a story of its own, and yet had been set aside. Over the years, gold and diamonds had taken their place.
                </p>
                <p>I wanted to wear each of those pieces. And yet I wondered why silver had become something we keep instead of something we wear. My curiosity made me turn to my roots for inspiration. In Marwar tradition, silver was not just for special days; it was part of how women dressed, and how they carried tradition into daily life.</p>
                <p>Legacy of Marwar is my way of bringing that effortless elegance back to life. Fine silver, designed for the life you live now; For a wedding, a festival, a dinner, a Tuesday.</p>
                <p>
                  At Legacy of Marwar, each piece is handcrafted with a touch of fortune and boundless love. Pure in material and timeless in its elegance, Legacy of Marwar is becoming a part of your story now.
                </p>
              </div>
              <div className="signature">
                <p className="message">For us, Silver is not a lesser metal. It is a timeless one, made to be worn on every occasion.</p>
                <p className="name">- Trishla Tekriwal</p>
              </div>
            </figcaption>
          </div>
        </div>

        <div className="door">
              <Image
                src="/images/about/door.svg"
                width={122}
                height={280}
                alt="tree"
              />
            </div>
      </div>
    </section>
  );
}
