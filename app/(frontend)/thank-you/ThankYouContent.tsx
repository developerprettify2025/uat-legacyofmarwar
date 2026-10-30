"use client";
import { useEffect, useState } from "react";
import ThankyouPage from "@/components/frontendcomponent/organisms/ThankyouPage";

const SITE_DOMAIN = "legacyofmarwar.com"; // apna sahi domain yahan check kar lo
const LAST_ORDER_KEY = "lastOrder";

const DEFAULT_DESC =
  "Thank you for your interest in Legacy Of Marwar. We will get back to you as soon as possible.";

type LastOrder = { orderNo: number; items: number; amount: number };

export default function ThankYouContent() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // cart wale redirects ke liye lagaya flag hata do
    try {
      sessionStorage.removeItem("orderJustPlaced");
    } catch {}

    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      // DEBUG: console me dekho data mila ya nahi (kaam kare to ye line hata do)
      console.log("[thank-you] lastOrder in localStorage:", raw);
      if (raw) {
        const data = JSON.parse(raw);
        const orderNo = Number(data?.orderNo);
        const items = Number(data?.items);
        const amount = Number(data?.amount);

        if (
          Number.isInteger(orderNo) &&
          orderNo > 0 &&
          Number.isInteger(items) &&
          items > 0 &&
          Number.isFinite(amount) &&
          amount >= 0
        ) {
          setOrder({ orderNo, items, amount });
        }
        // padh liya -> localStorage se hata do (thoda ruk kar, taki dev me
        // effect do baar chale to bhi data na khoye)
        setTimeout(() => {
          try {
            localStorage.removeItem(LAST_ORDER_KEY);
          } catch {}
        }, 1500);
      }
    } catch {}

    setReady(true);
  }, []);

  if (!ready) return null;

  const desc = order
    ? `Thank you for shopping at ${SITE_DOMAIN}. You have got a perfect choice! We have received your order having ${order.items} ${
        order.items === 1 ? "item" : "items"
      } worth of ₹ ${order.amount.toLocaleString("en-IN")} on our website against the order number ${order.orderNo}.`
    : DEFAULT_DESC;

  return <ThankyouPage title="Thank You" desc={desc} />;
}
