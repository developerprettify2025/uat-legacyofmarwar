"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout, setAccounts } from "@/store/slice/authSlice";
import { useRouter } from 'next/navigation';

export default function DashboardNav() {
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();

  const { user, accounts = [] } = useSelector(
    (state: any) => state.auth ?? {}
  );

  // Bind customer data from Redux auth storage
  const customer = user ?? accounts?.[0] ?? {};
  const customerName = customer.CustomerName ?? customer.customerName ?? customer.Name ?? customer.name ?? "Customer";
  const customerEmail = customer.CustomerEmailID ?? customer.customerEmailID ?? customer.EmailID ?? customer.email ?? "";
  const customerPhone = customer.CustomerPhoneNo ?? customer.customerPhoneNo ?? customer.PhoneNo ?? customer.phone ?? "";
  const customerImage = customer?.CustomerImage ?? user?.CustomerImage ?? "";
  const profileImage = customerImage ? `/OnlineImages/CustomerImages/${customerImage}` : "/OnlineImages/CustomerImages/user.svg";
  //console.log(profileImage);

  const profilePage = pathname.startsWith("/my-account");
  const orderPage = pathname.startsWith("/my-order");
  const wishlistPage = pathname.startsWith("/my-wishlist");
  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    dispatch(logout());
    router.push("/");
  };
  return (
    <div className="aside-left card-body">
      <div className="aside-left-wrap">
        <div className="profile-col">
          <div className="ico">
            <Image
              src={profileImage}
              alt="Profile Image"
              width={70}
              height={70}
            />
          </div>

          <p className="wlcm">Welcome</p>
          <p className="name-usr">{customerName}</p>

          {customerEmail && (
            <div className="usr-email">
              <Link href={`mailto:${customerEmail}`}>
                {customerEmail}
              </Link>
              <div className="fig">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="#fff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="m5 14l3.5 3.5L19 6.5"
                  />
                </svg>
              </div>
            </div>
          )}

          {customerPhone && (
            <div className="usr-email">
              <Link href={`tel:${customerPhone}`}>
                {customerPhone}
              </Link>
              <div className="fig">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="#fff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="m5 14l3.5 3.5L19 6.5"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="nav-col">
          <ul>
            <li> <Link className={profilePage ? "active" : ""} href="/my-account" > My Profile </Link> </li>
            <li> <Link className={orderPage ? "active" : ""} href="/my-order" > Orders </Link> </li>
            <li> <Link className={wishlistPage ? "active" : ""} href="/my-wishlist" > Wishlist </Link> </li>
            <li><Link className="" href="/" onClick={handleLogout}>Logout</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}