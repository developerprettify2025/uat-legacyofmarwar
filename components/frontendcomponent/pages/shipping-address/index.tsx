"use client";
import CheckoutHeader from "../../organisms/CheckoutHeader";
import AddressPop from "./AddressPop";
import ShippingDetails from "./ShippingDetails";
import "@/uploads/sass/checkout/checkout.css";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useModal } from "@/hooks/useModal";
import { useCart } from "@/context/CartContext";

export default function ShippingAddressPage() {
  const { openModal } = useModal();
  const router = useRouter();
  const { cartItems, loaded } = useCart();

  const { user, accounts = [] } = useSelector((state: any) => state.auth ?? {});
  const CustomerID =
    Number(
      user?.CustomerID ??
        user?.customerID ??
        user?.CustomerId ??
        accounts?.[0]?.CustomerID ??
        accounts?.[0]?.customerID ??
        accounts?.[0]?.CustomerId ??
        0,
    ) || 0;

  const isLoggedIn = CustomerID > 0;
  const hasCart = !!cartItems && cartItems.length > 0;

  const redirected = useRef(false); // double toast / double redirect se bachne ke liye

  useEffect(() => {
    if (!loaded || redirected.current) return;

    // order abhi place hua hai -> thank you page par ja rahe hain, kuch mat karo
    try {
      if (sessionStorage.getItem("orderJustPlaced")) return;
    } catch {}

    // 1) Cart empty -> home + toast
    if (!hasCart) {
      redirected.current = true;
      toast.error("You have no cart item");
      router.replace("/");
      return;
    }

    // 2) Cart hai but login nahi -> cart page + login popup
    if (!isLoggedIn) {
      redirected.current = true;
      openModal("loginPop");
      router.replace("/shopping-cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, hasCart, isLoggedIn]);

  // order ke baad bhi ShippingDetails ko mount rehne do (wo khud null return karta hai)
  let justOrdered = false;
  try {
    justOrdered = !!sessionStorage.getItem("orderJustPlaced");
  } catch {}

  if (!loaded) return null;
  if (!justOrdered && (!hasCart || !isLoggedIn)) return null;

  return (
    <main>
      <CheckoutHeader />
      <ShippingDetails />
      <AddressPop />
    </main>
  );
}
