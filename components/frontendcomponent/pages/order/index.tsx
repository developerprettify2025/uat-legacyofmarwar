
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import DashboardNav from "../../organisms/DashboardNav";
import OrderList from "./OrderList";
import "@/uploads/sass/dashboard/dashboard.css";
import { useGetCustomerOrdersQuery } from "@/store/backendSlice/customerOrderAPISlice";

export default function OrderPage() {
  const router = useRouter();

  const { user, accounts = [] } = useSelector(
    (state: any) => state.auth ?? {}
  );

  const CustomerID = Number(
    user?.CustomerID ??
      user?.customerID ??
      user?.CustomerId ??
      accounts?.[0]?.CustomerID ??
      accounts?.[0]?.customerID ??
      accounts?.[0]?.CustomerId ??
      0
  );
  console.log(CustomerID)
  const {
    data: wishlistOrOrdersResponse,
    isLoading,
    isError,
  } = useGetCustomerOrdersQuery(CustomerID, {
    skip: !CustomerID,
  });

  useEffect(() => {
    if (CustomerID === 0) {
      router.replace("/");
    }
  }, [CustomerID, router]);

  if (CustomerID === 0) {
    return null;
  }

  const orders = wishlistOrOrdersResponse?.data ?? [];
  console.log(orders);
  return (
    <main>
      <section>
        <div className="dashboard-secA sec-pad-all">
          <div className="container">
            <div className="flex main_wrapper">
              <DashboardNav />

              <OrderList
                orders={orders}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
