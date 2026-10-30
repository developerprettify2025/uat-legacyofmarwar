"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import DashboardNav from "../../organisms/DashboardNav";
import "@/uploads/sass/dashboard/dashboard.css";
import WishlistDetails from "./WishlistDetails";
import { useGetCustomerWishlistQuery } from "@/store/backendSlice/customerWishlistAPISlice";
import NotFound from "../../organisms/NotFound";
export default function WishlistPage() {
  const router = useRouter();

  const { user, accounts = [] } = useSelector((state: any) => state.auth ?? {});

  const CustomerID = Number(
    user?.CustomerID ??
      user?.customerID ??
      user?.CustomerId ??
      accounts?.[0]?.CustomerID ??
      accounts?.[0]?.customerID ??
      accounts?.[0]?.CustomerId ??
      0,
  );
  const {
    data: wishlistResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetCustomerWishlistQuery(CustomerID, { skip: CustomerID <= 0 });
  useEffect(() => {
    if (CustomerID === 0) {
      router.replace("/");
    }
  }, [CustomerID, router]);

  if (CustomerID === 0) {
    return null;
  }
  return (
    <main>
      <section>
        <div className="dashboard-secA sec-pad-all">
          <div className="container">
            <div className="flex main_wrapper">
              <DashboardNav />
              {isLoading ? (
                <p>Loading wishlist...</p>
              ) : (wishlistResponse?.data?.length ?? 0) > 0 ? (
                <WishlistDetails wishlistdata={wishlistResponse.data} />
              ) : (
                <NotFound
                  desc="No Wishlist found"
                  className="not-found2 wishlist-not-found"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
