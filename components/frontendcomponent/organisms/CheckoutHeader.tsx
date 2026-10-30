"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CheckoutHeader() {
  const pathname = usePathname();
  let cartPage = pathname.startsWith("/shopping-cart");
  let addressPage = pathname.startsWith("/shipping-address");
  let paymentPage = pathname.startsWith("/check-out");
  return (
    <section>
      <div className="checkout_header">
        <div className="container">
          <ul>
            <li>
              <Link
                href="/shopping-cart"
                className={`${cartPage || addressPage || paymentPage ? "active" : ""}`}
              >
                <div className="icon">
                  <svg
                    width={10}
                    height={9}
                    viewBox="0 0 10 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.33333 8.66671L0 5.33337L1.16667 4.16671L3.33333 6.33337L8.83333 0.833374L10 2.00004L3.33333 8.66671Z"
                      fill="white"
                    />
                  </svg>
                </div>
                Bag
              </Link>
            </li>
            <li>
              <Link
                href="/shipping-address"
                className={`${addressPage || paymentPage ? "active" : ""}`}
              >
                <div className="icon">
                  <svg
                    width={10}
                    height={9}
                    viewBox="0 0 10 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.33333 8.66671L0 5.33337L1.16667 4.16671L3.33333 6.33337L8.83333 0.833374L10 2.00004L3.33333 8.66671Z"
                      fill="white"
                    />
                  </svg>
                </div>
                Address
              </Link>
            </li>
            {/* <li>
              <Link
                href="/check-out"
                className={`${paymentPage ? "active" : ""}`}
              >
                <div className="icon">
                  <svg
                    width={10}
                    height={9}
                    viewBox="0 0 10 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.33333 8.66671L0 5.33337L1.16667 4.16671L3.33333 6.33337L8.83333 0.833374L10 2.00004L3.33333 8.66671Z"
                      fill="white"
                    />
                  </svg>
                </div>
                Payment
              </Link>
            </li> */}
          </ul>
        </div>
      </div>
    </section>
  );
}
