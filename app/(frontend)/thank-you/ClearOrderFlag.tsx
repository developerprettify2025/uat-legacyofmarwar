"use client";
import { useEffect } from "react";

// thank you page khulte hi flag hata do, taki cart wale redirects aage normal chalein
export default function ClearOrderFlag() {
  useEffect(() => {
    try {
      sessionStorage.removeItem("orderJustPlaced");
    } catch {}
  }, []);

  return null;
}
