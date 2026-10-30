import Button from "../atoms/Button";

export default function NotFound({
  className = "",
  desc = "Product Not Found!",
  linkHref = "/",
  buttonText = "Continue",
  btn = false,
}: {
  className?: string;
  desc?: string;
  linkHref?: string;
  buttonText?: string;
  btn?: boolean;
}) {
  return (
    <div className={`product-not-found ${className}`}>
      <div className="nt-fnd-wrp">
        <div className="icon">
          {/* <img src="/icon/not-found.gif" className="ico" alt="not-found"></img> */}
          <img
            src="/images/home/discover-elephant.png"
            className="ico"
            alt="not-found"
          ></img>
        </div>
        <p>{desc}</p>
        {btn && (
          <Button
            classname="solid-primary"
            buttonText={buttonText}
            linkHref={linkHref}
          />
        )}
      </div>
    </div>
  );
}
