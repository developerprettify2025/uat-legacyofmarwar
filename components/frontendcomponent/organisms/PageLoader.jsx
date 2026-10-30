"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";

export default function PageLoader({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // Adjust the delay as needed (in milliseconds)

    return () => clearTimeout(timer);
  }, [pathname]);

  if (loading) {
    return <Loading />;
  }

  return children;
}