import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

interface ButtonProps {
  classname?: string;
  linkHref?: string;
  buttonText?: string;
  svgpath?: ReactNode | string | StaticImageData;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  [key: string]: unknown;
}

export default function Button({
  classname = "",
  linkHref = "",
  buttonText = "",
  svgpath = null,
  onClick,
  ...rest
}: ButtonProps) {
  const className = `btn ${classname}`;
  const isImageSrc =
    typeof svgpath === "string" ||
    (typeof svgpath === "object" && svgpath !== null && "src" in svgpath);
  const icon = isImageSrc ? (
    <Image
      src={svgpath as string | StaticImageData}
      alt="icon"
      width="18"
      height="14"
    />
  ) : (
    (svgpath as ReactNode)
  );

  const content = (
    <>
      {buttonText}
      {icon}
    </>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className={className} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}
