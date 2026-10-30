import Button from "../atoms/Button";

interface BannerProps {
  title: string;
  desc: string;
}

export default function ThankyouPage({ title = "", desc = "" }: BannerProps) {
  return (
    <div className="banner thankyou">
      <div className="bg">
        <video
          src="/images/other/thank-you.jpg"
          poster="/images/other/thank-you.jpg"
          autoPlay
          loop
          muted
          playsInline
        ></video>
        <div className="banner-wrapper">
          <div className="container">
            <div className="heading">
              <h1>{title}</h1>
              <p>{desc}</p>
              <Button
                classname="solid-primary"
                buttonText="Go to Home"
                linkHref="/"
              ></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
