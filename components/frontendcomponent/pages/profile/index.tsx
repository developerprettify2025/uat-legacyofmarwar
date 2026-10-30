
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import DashboardNav from "../../organisms/DashboardNav";
import ProfileForm from "./ProfileForm";
import "@/uploads/sass/dashboard/dashboard.css";

export default function ProfilePage() {
  const router = useRouter();

  const { user, accounts = [] } = useSelector(
    (state: any) => state.auth ?? {}
  );

  const CustomerID = Number(user?.CustomerID ?? user?.customerID ?? user?.CustomerId ?? accounts?.[0]?.CustomerID ?? accounts?.[0]?.customerID ?? accounts?.[0]?.CustomerId ?? 0);

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
              <ProfileForm CustomerID={CustomerID} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}