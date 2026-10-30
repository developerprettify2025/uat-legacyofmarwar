"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { CheckoutPricing } from "@/app/types/CheckoutPricing";
import { useCreateCustomerOrderMutation } from "@/store/backendSlice/customerOrderAPISlice";
import CheckoutBottom from "../../molecules/CheckoutBottom";
import CheckoutTotalList from "../../molecules/CheckoutTotalList";

const SHIPPING_PAGE_URL = "/shipping-payment"; // address page
const SUCCESS_PAGE_URL = "/order-success"; // apna success page route yahan daalo
const SELECTED_ADDRESS_KEY = "selectedShippingAddress";

type PaymentMode = "COD" | "ONLINE";

const BankListData = Array.from({ length: 9 }, (_, i) => ({
  imgSrc: `/images/checkout/payment${i + 1}.png`,
}));

export default function PaymentDetails() {
  const router = useRouter();
  const { cartItems, loaded, getCartSummary, clearCart } = useCart();
  const [createOrder, { isLoading: isPlacing }] =
    useCreateCustomerOrderMutation();

  const [paymentMode, setPaymentMode] = useState<PaymentMode | "ONLINE">("ONLINE");
  const orderPlaced = useRef(false); // double click / double submit se bachne ke liye

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

  // ---------- guards ----------
  if (!loaded) return null;
  if (!cartItems || cartItems.length === 0) return null;

  // ---------- totals (shipping page jaisa) ----------
  const summary = getCartSummary(false);

  const totalMrp = cartItems.reduce(
    (sum: number, i: any) =>
      sum + (Number(i.productMRP) || Number(i.price)) * i.quantity,
    0,
  );
  const totalSp = summary.totalMRP; // coupon se pehle

  const checkoutItems: CheckoutPricing[] = [
    { id: "mrp", label: "Total MRP", amount: totalMrp, type: "add" },
    {
      id: "discount",
      label: "Discount on MRP",
      amount: Math.max(0, totalMrp - totalSp),
      type: "subtract",
    },
    {
      id: "coupon",
      label: "Coupon Discount",
      amount: summary.couponDiscount,
      type: "subtract",
    },
    {
      id: "shipping",
      label: "Shipping Fee",
      amount: 0,
      type: "add",
      freeLabel: "Free",
    },
  ];

  // ---------- place order ----------
  const handlePlaceOrder = async () => {
    if (isPlacing || orderPlaced.current) return;

    if (CustomerID < 1) return toast.error("Please login to place order");
    if (!paymentMode) return toast.error("Please select a payment mode");

    // shipping page me jo address select hua tha
    let address: any = null;
    try {
      address = JSON.parse(localStorage.getItem(SELECTED_ADDRESS_KEY) || "null");
    } catch {}
    const addressID = Number(address?.CustomerShippingAddressID) || 0;
    if (!addressID) {
      toast.error("Please select a delivery address");
      return router.replace(SHIPPING_PAGE_URL);
    }

    // cart item -> API item (ProductColorID + ProductQuantity)
    const items = cartItems.map((i: any) => ({
      ProductColorID: Number(i.productColorID ?? i.ProductColorID ?? 0),
      ProductQuantity: Number(i.quantity),
    }));
    if (items.some((i: any) => !i.ProductColorID || i.ProductQuantity < 1)) {
      return toast.error("Some cart items are invalid. Please re-add them.");
    }

    try {
      orderPlaced.current = true;

      const res: any = await createOrder({
        CustomerID,
        CustomerShippingAddressID: addressID,
        items,
        OrderStatus: "Pending",
        TransactionStatus: "Pending",
        PaymentMode: paymentMode, // "COD" | "ONLINE" (backend support na ho to hata do)
        UpdatedBy: user?.CustomerName || user?.Name || "Website",
      }).unwrap();

      toast.success(
        res?.OrderNo
          ? `${res?.message || "Order placed"} Order No. ${res.OrderNo}`
          : res?.message || "Order placed successfully",
      );

      // pehle redirect, phir cart clear (warna empty-cart guard home par bhej dega)
      router.replace(
        res?.OrderNo
          ? `${SUCCESS_PAGE_URL}?orderNo=${encodeURIComponent(res.OrderNo)}`
          : SUCCESS_PAGE_URL,
      );
      clearCart();
      try {
        localStorage.removeItem(SELECTED_ADDRESS_KEY);
      } catch {}
    } catch (error: any) {
      orderPlaced.current = false;
      toast.error(error?.data?.message || "Could not place order");
    }
  };

  return (
    <div className="checkout-main sec-pad-all">
      <div className="container">
        <div className="main_wrapper flex">
          <div className="colA">
            <div className="top-nav">
              <h6>Choose Payment Mode</h6>
            </div>
            <div className="payment_wrapper">
              {/* <div className="payment_col">
                <input
                  type="radio"
                  name="payment"
                  id="cod"
                  checked={paymentMode === "COD"}
                  onChange={() => setPaymentMode("COD")}
                />
                <div className="in-bx"></div>
                <span>COD</span>
              </div> */}
              <div className="payment_col">
                <input
                  type="radio"
                  name="payment"
                  id="online"
                  checked={paymentMode === "ONLINE"}
                  onChange={() => setPaymentMode("ONLINE")}
                />
                <div className="in-bx"></div>
                <span>Online Payment</span>
              </div>
            </div>
          </div>

          <div className="colB">
            <p className="total_products">
              Price Details {`(${cartItems.length} Items)`}
            </p>
            <CheckoutTotalList
              buttonText={isPlacing ? "placing order..." : "continue"}
              classname="shipping-total"
              items={checkoutItems}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>
        <CheckoutBottom data={BankListData} />
      </div>
    </div>
  );
}
