"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import "@/uploads/sass/header/header.css";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout, setAccounts } from "@/store/slice/authSlice";
import { useLoginByOtpMutation } from "@/store/backendSlice/customerAPISlice";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { cartItems } = useCart();
  const totalQty = cartItems.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0,
  );
  const { openModal } = useModal();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // single-segment static pages in your site (add any others you have)
  const staticRoutes = [
    "privacy-policy",
    "shipping-and-delivery",
    "returns-and-exchanges",
    "terms-and-conditions",
    "shopping-cart",
    "shipping-address",
    "shipping-payment",
    "my-account",
    "my-order",
    "my-wishlist",
    "about-us",
    "contact-us",
    "blogs",
    "products",
    "legacy-of-marwar-home-live",
  ];
  const ProductDetails =
    pathname.startsWith("/product-details") ||
    (segments.length === 1 && !staticRoutes.includes(segments[0]));
  const PrivacyPolicy = pathname.startsWith("/privacy-policy");
  const SippingAddress = pathname.startsWith("/shipping-and-delivery");
  const ReturnsAndExchanges = pathname.startsWith("/returns-and-exchanges");
  const TermsAndConditions = pathname.startsWith("/terms-and-conditions");
  const shoppingCart = pathname.startsWith("/shopping-cart");
  const shippingAddress = pathname.startsWith("/shipping-address");
  const shippingPayment = pathname.startsWith("/check-out");
  const profilePage = pathname.startsWith("/my-account");
  const orderPage = pathname.startsWith("/my-order");
  const wishlistPage = pathname.startsWith("/my-wishlist");
  const headerFit =
    ProductDetails ||
    shoppingCart ||
    shippingAddress ||
    shippingPayment ||
    profilePage ||
    orderPage ||
    wishlistPage ||
    PrivacyPolicy ||
    SippingAddress ||
    TermsAndConditions ||
    ReturnsAndExchanges;
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* User Login Check */
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    user,
    isLoggedIn = false,
    accounts: reduxAccounts = [],
  } = useSelector((state: any) => state.auth ?? {});
  const [fetchAccountsApi] = useLoginByOtpMutation();
  const [localAccounts, setLocalAccounts] = useState(reduxAccounts || []);
  const fetchedAccountsRef = useRef(false);
  const wishlist = Number(user?.TotalWishlist) || 0;
  useEffect(() => {
    if (reduxAccounts && reduxAccounts.length > 0) {
      setLocalAccounts(reduxAccounts);
    }
  }, [reduxAccounts]);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      fetchedAccountsRef.current = false;
      return;
    }

    // Avoid infinite loop: fetch only once per login session
    if (fetchedAccountsRef.current) return;
    if (reduxAccounts && reduxAccounts.length > 1) return;

    const email = (
      user?.CustomerEmailID ||
      user?.customerEmailID ||
      user?.CustomerEmail ||
      user?.Email ||
      ""
    ).trim();
    const mobile = (
      user?.CustomerMobileNo ||
      user?.customerMobileNo ||
      user?.CustomerMobile ||
      ""
    )
      .trim()
      .replace(/^\+91\s?/, "");

    if (!email && !mobile) return;

    fetchedAccountsRef.current = true;

    const fetchAccounts = async () => {
      try {
        const payload = email
          ? { customerEmailID: email, customerMobileNo: "" }
          : { customerEmailID: "", customerMobileNo: mobile };
        const res = await fetchAccountsApi(payload).unwrap();
        if (res?.success && Array.isArray(res?.data) && res.data.length > 0) {
          setLocalAccounts(res.data);
          dispatch(setAccounts(res.data));
        }
      } catch {
        // ignore error silently
      }
    };
    fetchAccounts();
  }, [
    user?.CustomerID,
    user?.CustomerEmailID,
    user?.CustomerMobileNo,
    isLoggedIn,
  ]);

  const allAccounts =
    localAccounts && localAccounts.length > 0
      ? localAccounts
      : reduxAccounts || [];

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    dispatch(logout());
    router.push("/");
  };
  /* User Login Check */
  return (
    <header
      className={`${isScrolled ? "header-fixed" : ""} ${headerFit ? "header-fit" : ""}`}
    >
      <div className="container-fluid">
        <div className="header-container">
          <div className="colA">
            <button
              type="button"
              className="ham-btn"
              onClick={() => openModal("hamPop")}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <div className="colB">
            <Link href="/" className="logo">
              <Image
                width={152}
                height={110}
                src={
                  isScrolled || headerFit
                    ? "/images/logo-dark.svg"
                    : "/images/logo.svg"
                }
                alt="logo"
              />
            </Link>
          </div>
          <div className="colC">
            <ul className="nav-items">
              <li>
                <button
                  type="button"
                  className="search"
                  onClick={() => openModal("searchPop")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="m21 21l-4.486-4.494M19 10.5a8.5 8.5 0 1 1-17 0a8.5 8.5 0 0 1 17 0Z"
                    ></path>
                  </svg>
                </button>
              </li>
              {isLoggedIn ? (
                <>
                  <li className="myAccount">
                    <button
                      type="button"
                      className="user"
                      aria-label="My Account"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                      >
                        {" "}
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        >
                          {" "}
                          <path d="M20 21a7.53 7.53 0 0 0-7.005-6.934L12 14q-.531.015-1 .038c-3.7.181-6.716 3.268-7 6.962" />{" "}
                          <circle cx={12} cy={7} r={4} />{" "}
                        </g>{" "}
                      </svg>
                    </button>
                    <div className="dropdown-menu">
                      <ul>
                        <li>
                          <Link href="/my-account">My Account</Link>
                        </li>
                        <li>
                          <Link href="/my-order">My Order</Link>
                        </li>
                        <li>
                          <Link href="/my-wishlist">My Wishlist</Link>
                        </li>
                        <li>
                          <button type="button" onClick={handleLogout}>
                            Log Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  </li>
                  <li>
                    <Link href="/my-wishlist" className="wishlist">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 1024 1024"
                      >
                        <path
                          fill="currentColor"
                          d="M923 283.6a260 260 0 0 0-56.9-82.8a264.4 264.4 0 0 0-84-55.5A265.3 265.3 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39q-15 9.15-28.5 20.1q-13.5-10.95-28.5-20.1c-41.8-25.5-89.9-39-139.2-39c-35.5 0-69.9 6.8-102.4 20.3c-31.4 13-59.7 31.7-84 55.5a258.4 258.4 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9c0 33.3 6.8 68 20.3 103.3c11.3 29.5 27.5 60.1 48.2 91c32.8 48.9 77.9 99.9 133.9 151.6c92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3c56-51.7 101.1-102.7 133.9-151.6c20.7-30.9 37-61.5 48.2-91c13.5-35.3 20.3-70 20.3-103.3c.1-35.3-7-69.6-20.9-101.9M512 814.8S156 586.7 156 385.5C156 283.6 240.3 201 344.3 201c73.1 0 136.5 40.8 167.7 100.4C543.2 241.8 606.6 201 679.7 201c104 0 188.3 82.6 188.3 184.5c0 201.2-356 429.3-356 429.3"
                        ></path>
                      </svg>
                    </Link>
                    <span className="dot-noti">{wishlist}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="myAccount">
                    <button
                      type="button"
                      className="user"
                      onClick={() => openModal("loginPop")}
                      aria-label="Login"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                      >
                        {" "}
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        >
                          {" "}
                          <path d="M20 21a7.53 7.53 0 0 0-7.005-6.934L12 14q-.531.015-1 .038c-3.7.181-6.716 3.268-7 6.962" />{" "}
                          <circle cx={12} cy={7} r={4} />{" "}
                        </g>{" "}
                      </svg>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="wishlist"
                      onClick={() => openModal("loginPop")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 1024 1024"
                      >
                        <path
                          fill="currentColor"
                          d="M923 283.6a260 260 0 0 0-56.9-82.8a264.4 264.4 0 0 0-84-55.5A265.3 265.3 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39q-15 9.15-28.5 20.1q-13.5-10.95-28.5-20.1c-41.8-25.5-89.9-39-139.2-39c-35.5 0-69.9 6.8-102.4 20.3c-31.4 13-59.7 31.7-84 55.5a258.4 258.4 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9c0 33.3 6.8 68 20.3 103.3c11.3 29.5 27.5 60.1 48.2 91c32.8 48.9 77.9 99.9 133.9 151.6c92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3c56-51.7 101.1-102.7 133.9-151.6c20.7-30.9 37-61.5 48.2-91c13.5-35.3 20.3-70 20.3-103.3c.1-35.3-7-69.6-20.9-101.9M512 814.8S156 586.7 156 385.5C156 283.6 240.3 201 344.3 201c73.1 0 136.5 40.8 167.7 100.4C543.2 241.8 606.6 201 679.7 201c104 0 188.3 82.6 188.3 184.5c0 201.2-356 429.3-356 429.3"
                        ></path>
                      </svg>
                    </button>
                    <span className="dot-noti">0</span>
                  </li>
                </>
              )}
              <li>
                <Link className="cart" href={"/shopping-cart"}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={36}
                      d="M80 176a16 16 0 0 0-16 16v216c0 30.24 25.76 56 56 56h272c30.24 0 56-24.51 56-54.75V192a16 16 0 0 0-16-16Zm80 0v-32a96 96 0 0 1 96-96h0a96 96 0 0 1 96 96v32"
                    ></path>
                  </svg>
                </Link>
                <span className="dot-noti">{totalQty}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
