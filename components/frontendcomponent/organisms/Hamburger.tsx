"use client";
import Image from "next/image";
import Link from "next/link";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import { useGetHeaderDataQuery } from "@/store/frontendSlice/homePageAPISlice";

interface SocialLink {
  name: string;
  href: string;
  viewBox: string;
  path: string;
}

interface CategoryItem {
  linkHref: string;
  title: string;
  icon: string;
}

interface NavItem {
  linkHref: string;
  title: string;
}

const socialLinks: SocialLink[] = [
  // {
  //   name: "Twitter",
  //   href: "#",
  //   viewBox: "0 0 16 16",
  //   path: "M9.294 6.928L14.357 1h-1.2L8.762 6.147L5.25 1H1.2l5.31 7.784L1.2 15h1.2l4.642-5.436L10.751 15h4.05zM7.651 8.852l-.538-.775L2.832 1.91h1.843l3.454 4.977l.538.775l4.491 6.47h-1.843z",
  // },
  {
    name: "Facebook",
    href: "https://www.facebook.com/legacyofmarwar",
    viewBox: "0 0 640 640",
    path: "M240 363.3V576h116V363.3h86.5l18-97.8H356v-34.6c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4.4 37 1.2V71.9C451.4 68 416.4 64 396.2 64C289.3 64 240 114.5 240 223.4v42.1h-66v97.8z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/legacyofmarwar/",
    viewBox: "0 0 24 24",
    path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3",
  },
  // {
  //   name: "LinkedIn",
  //   href: "#",
  //   viewBox: "0 0 24 24",
  //   path: "M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z",
  // },
];

const categoryData: CategoryItem[] = [];

const hamData: NavItem[] = [
  { linkHref: "/about-us", title: "Our Story" },
  { linkHref: "/contact-us", title: "Contact Us" },
  // { linkHref: "/faqs", title: "FAQ's" },
  //{ linkHref: "/careers", title: "Careers" },
  { linkHref: "/blogs", title: "Blogs" },
];

export default function Hamburger() {
  const { data: headerData, isLoading } = useGetHeaderDataQuery(undefined);
  const categories = headerData?.categories || [];
  const categoryData: CategoryItem[] = categories.map((item: any) => ({
    linkHref: `/products/${item.CategoryNameURL}`,
    title: item.CategoryName,
    icon: `/OnlineImages/CategoryImages/${item.CategoryImage}`,
  }));
  const universaldata = headerData?.page || [];
  const phoneDigits = String(universaldata?.StaticPhoneNumber ?? "")
    .replace(/^\+?91/, "")
    .replace(/\D/g, "");
  const { closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);

  return (
    <div className={`model ham-pop ${isModal === "hamPop" ? "is-open" : ""}`}>
      <button
        type="button"
        className="close"
        onClick={closeModal}
        aria-label="Close menu"
      >
        <svg
          width={26}
          height={26}
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.5 0.5L25.5 25.5M0.5 25.5L25.5 0.5"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="model-body">
        <Link className="icon" href="/" onClick={closeModal}>
          <Image
            src="/icon/logo-vector.svg"
            width={43}
            height={37}
            alt="Legacy of Marwar logo"
          />
        </Link>

        <div className="main_wrapper">
          {/* <div className="category_grid">
            {categoryData.map((item) => (
              <Link
                className="category_col"
                href={item.linkHref}
                key={item.title}
                onClick={closeModal}
              >
                <p>{item.title}</p>
                <figure>
                  <Image src={item.icon} width={59} height={59} alt="" />
                </figure>
              </Link>
            ))}
          </div> */}

          <ul className="nav-items">
            {categoryData.map((item) => (
              <li key={item.title}>
                <Link href={item.linkHref} onClick={closeModal}>
                  {item.title}
                </Link>
              </li>
            ))}
            {hamData.map((item) => (
              <li key={item.title}>
                <Link href={item.linkHref} onClick={closeModal}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bottom-list">
          <ul className="social-icons">
            {socialLinks.map((social) => (
              <li key={social.name}>
                <Link
                  href={social.href}
                  aria-label={social.name}
                  target="_blank"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox={social.viewBox}
                  >
                    <path fill="currentColor" d={social.path} />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
