"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useModal } from "@/hooks/useModal";
import { useCart } from "@/context/CartContext";
import { CheckoutPricing } from "@/app/types/CheckoutPricing";
import {
  useGetCustomerShippingAddressesQuery,
  useDeleteCustomerShippingAddressMutation,
} from "@/store/backendSlice/customerShippingAddressAPISlice";
import {
  useCreateCustomerOrderMutation,
  useUpdateCustomerOrderStatusMutation,
  useUpdateCustomerOrderPaymentStatusMutation,
} from "@/store/backendSlice/customerOrderAPISlice";
import Button from "../../atoms/Button";
import CheckoutBottom from "../../molecules/CheckoutBottom";
import CheckoutTotalList from "../../molecules/CheckoutTotalList";

const THANK_YOU_URL = "/thank-you"; // apna thank you page route
const LAST_ORDER_KEY = "lastOrder"; // thank you page isi se message banata hai
const SELECTED_ADDRESS_KEY = "selectedShippingAddress";
const DEFAULT_ADDRESS_KEY = "defaultShippingAddressID";

const BankListData = Array.from({ length: 9 }, (_, i) => ({
  imgSrc: `/images/checkout/payment${i + 1}.png`,
}));

export default function ShippingDetails() {
  const router = useRouter();
  const { openModal } = useModal();

  // ---------- hooks (sab return se pehle) ----------
  const { cartItems, loaded, getCartSummary, clearCart } = useCart();

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

  const { data: addressRes, isLoading: isAddressLoading } =
    useGetCustomerShippingAddressesQuery(CustomerID, { skip: CustomerID < 1 });
  const [deleteAddress, { isLoading: isDeleting }] =
    useDeleteCustomerShippingAddressMutation();
  const [createOrder, { isLoading: isPlacing }] =
    useCreateCustomerOrderMutation();
  const [updateOrderStatus] = useUpdateCustomerOrderStatusMutation();
  const [updateOrderPaymentStatus, { isLoading: isUpdatingPayment }] =
    useUpdateCustomerOrderPaymentStatusMutation();
  const [isPaying, setIsPaying] = useState(false);

  const addresses: any[] = addressRes?.data ?? [];
  const [selectedID, setSelectedID] = useState<number | null>(null);

  const [orderDone, setOrderDone] = useState(false); // order ke baad "Cart not found" flash na aaye
  const placingRef = useRef(false); // double click se bachne ke liye

  // login nahi hai to popup (sirf ek baar)
  const loginAsked = useRef(false);
  useEffect(() => {
    if (loaded && CustomerID < 1 && !loginAsked.current) {
      loginAsked.current = true;
      openModal("loginPop");
    }
    if (CustomerID >= 1) loginAsked.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, CustomerID]);

  // addresses aane par: purana selection, phir saved, phir default, warna pehla address
  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedID(null);
      return;
    }
    const exists = (id: number | null) =>
      addresses.some((a) => Number(a.CustomerShippingAddressID) === id);

    setSelectedID((current) => {
      // 1) abhi jo selected hai
      if (current && exists(current)) return current;

      try {
        // 2) pehle select kiya tha wo address
        const saved = JSON.parse(
          localStorage.getItem(SELECTED_ADDRESS_KEY) || "null",
        );
        const savedID = Number(saved?.CustomerShippingAddressID);
        if (savedID && exists(savedID)) return savedID;

        // 3) default address
        const defaultID = Number(localStorage.getItem(DEFAULT_ADDRESS_KEY) || 0);
        if (defaultID && exists(defaultID)) return defaultID;
      } catch { }

      // 4) warna pehla address
      return Number(addresses[0].CustomerShippingAddressID);
    });
  }, [addresses]);

  // ---------- guards ----------
  if (loaded === false) return null;

  // order ho gaya, thank you page par ja rahe hain
  if (orderDone) return null;

  if (!cartItems || cartItems.length === 0) {
    return (
      <section>
        <div className="checkout-main sec-pad-all">
          <div className="container">
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <h4>Cart not found</h4>
              <p style={{ margin: "12px 0 24px" }}>
                Your cart is empty. Add some products to continue.
              </p>
              <Link href="/products" className="btn solid-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---------- totals (cart page jaisa) ----------
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

  // ---------- actions ----------
  const handleAddNew = () => {
    if (CustomerID < 1) return openModal("loginPop");
    window.dispatchEvent(new CustomEvent("address-pop:open", { detail: null }));
    openModal("addressPop");
  };

  const handleEdit = (address: any) => {
    if (CustomerID < 1) return openModal("loginPop");
    window.dispatchEvent(
      new CustomEvent("address-pop:open", { detail: address }),
    );
    openModal("addressPop");
  };

  const handleRemove = async (address: any) => {
    if (isDeleting) return;
    if (!window.confirm("Remove this address?")) return;

    try {
      const res = await deleteAddress({
        CustomerID,
        CustomerShippingAddressID: address.CustomerShippingAddressID,
      }).unwrap();
      toast.success(res?.message || "Address removed");

      const removedID = Number(address.CustomerShippingAddressID);
      if (removedID === selectedID) {
        setSelectedID(null);
        localStorage.removeItem(SELECTED_ADDRESS_KEY);
      }
      if (Number(localStorage.getItem(DEFAULT_ADDRESS_KEY)) === removedID) {
        localStorage.removeItem(DEFAULT_ADDRESS_KEY);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove address");
    }
  };

  // ---------- Razorpay helpers ----------
  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ORDER flow: address → create order (Pending) → Razorpay → verify → update Confirmed → thank you
  const handlePlaceOrder = async () => {
    if (isPlacing || placingRef.current) return;
    if (CustomerID < 1) return openModal("loginPop");

    const selected = addresses.find(
      (a) => Number(a.CustomerShippingAddressID) === selectedID,
    );
    if (!selected) return toast.error("Please select a delivery address");

    // cart item -> API item
    // ProductColorID cart me ho to wahi, warna backend ProductID + ColorID se nikal lega
    const items = cartItems.map((i: any) => ({
      ProductColorID: Number(i.productColorID ?? 0),
      ProductID: Number(i.productID ?? 0),
      ColorID: Number(i.colorID ?? 0),
      ProductQuantity: Number(i.quantity),
    }));
    if (
      items.some(
        (i: any) =>
          (!i.ProductColorID && !i.ProductID) ||
          !Number.isInteger(i.ProductQuantity) ||
          i.ProductQuantity < 1,
      )
    ) {
      return toast.error("Some cart items are invalid. Please re-add them.");
    }

    try {
      placingRef.current = true;

      // Step 1: Create order in DB with Pending/Failed status
      const res: any = await createOrder({
        CustomerID,
        CustomerShippingAddressID: Number(selected.CustomerShippingAddressID),
        items,
        OrderStatus: "Pending",
        TransactionStatus: "Pending",
        PaymentMode: "Online",
        CouponCode: summary.couponCode || "",
        UpdatedBy: user?.CustomerName || user?.Name || "Website",
      }).unwrap();

      const orderNo = res?.OrderNo;
      if (!orderNo) throw new Error(res?.message || "Order creation failed");

      // Step 2: Load Razorpay SDK
      setIsPaying(true);
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay SDK");

      // Step 3: Create Razorpay payment order on server
      const rzpOrderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1,       // rupees — server converts to paise
          currency: "INR",
          receipt: `order_${orderNo}`,
        }),
      });
      const rzpOrderData = await rzpOrderRes.json();
      if (!rzpOrderRes.ok || !rzpOrderData.success)
        throw new Error(rzpOrderData.message || "Failed to create payment order");

      let paymentSuccess = false;

      // Step 4: Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpOrderData.order.amount,
          currency: rzpOrderData.order.currency,
          name: "Legacy of Marwar",
          description: `Order #${orderNo}`,
          order_id: rzpOrderData.order.id,
          prefill: {
            name: user?.CustomerName || user?.Name || "",
            email: user?.CustomerEmailID || "",
          },
          theme: { color: "#8B6914" },
          modal: {
            ondismiss: () => {
              if (!paymentSuccess) {
                reject(new Error("Payment cancelled"));
              }
            },
          },
          handler: async (response: any) => {
            paymentSuccess = true;
            try {
              // Step 5: Verify signature on server
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success)
                return reject(new Error(verifyData.message || "Payment verification failed"));

              // Step 6: Update order payment status in DB (PaymentID, TransactionID, TransactionStatus, OrderStatus)
              await updateOrderPaymentStatus({
                OrderNo: orderNo,
                PaymentID: response.razorpay_payment_id,
                TransactionID: response.razorpay_payment_id,
                TransactionStatus: "Paid",
                OrderStatus: "Confirmed",
                PaymentOption: "Razorpay",
                UpdatedBy: user?.CustomerName || user?.Name || "Website",
                Remarks: `Razorpay Payment ID: ${response.razorpay_payment_id}, Order ID: ${response.razorpay_order_id}`,
              }).unwrap();

              // Step 7: Payment & status update successful — save info, toast, clear cart, redirect
              try {
                localStorage.setItem(
                  LAST_ORDER_KEY,
                  JSON.stringify({ orderNo, items: cartItems.length, amount: summary.total }),
                );
              } catch { }

              toast.success(`Order placed successfully! Order No. ${orderNo}`);
              setOrderDone(true);
              clearCart();
              try { localStorage.removeItem(SELECTED_ADDRESS_KEY); } catch { }
              router.replace(THANK_YOU_URL);

              resolve();
            } catch (err) {
              reject(err);
            }
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) =>
          reject(new Error(resp?.error?.description || "Payment failed"))
        );
        rzp.open();
      });

    } catch (error: any) {
      placingRef.current = false;
      setIsPaying(false);
      const msg: string = error?.message || error?.data?.message || "";
      if (msg === "Payment cancelled") {
        toast.error("Payment was cancelled. Your order is saved — complete payment anytime.");
      } else {
        toast.error(msg || "Could not complete order");
      }
    }
  };


  return (
    <section>
      <div className="checkout-main sec-pad-all">
        <div className="container">
          <div className="main_wrapper flex">
            <div className="colA">
              <div className="top-nav">
                <h6>Select Delivery Address</h6>
                <Button
                  buttonText="add new address"
                  classname="primary-border"
                  onClick={handleAddNew}
                />
              </div>

              <div className="address_wrapper">
                {CustomerID < 1 ? (
                  <p>Please login to see your saved addresses.</p>
                ) : isAddressLoading ? (
                  <p>Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <p>No address found. Please add a new address.</p>
                ) : (
                  addresses.map((item: any) => {
                    const id = Number(item.CustomerShippingAddressID);
                    const fullAddress = [
                      item.CustomerShippingAddressFullAddress,
                      item.CustomerShippingAddressLocality,
                      item.CustomerShippingAddressCity,
                      item.CustomerShippingAddressState,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <div className="address_col" key={id}>
                        <input
                          type="radio"
                          name="address"
                          id={`address-${id}`}
                          checked={selectedID === id}
                          onChange={() => setSelectedID(id)}
                        />
                        <div className="chk-box">
                          <div className="in-bx"></div>
                        </div>
                        <div className="content">
                          <h6 className="name">
                            {item.CustomerShippingAddressName}
                          </h6>
                          <p className="address">
                            {fullAddress} - {item.CustomerShippingAddressPinCode}
                          </p>
                          <div className="contact">
                            <p className="mob">
                              Mobile :{" "}
                              <Link
                                href={`tel:${item.CustomerShippingAddressPhoneNo}`}
                              >
                                {item.CustomerShippingAddressPhoneNo}
                              </Link>
                            </p>
                            <div className="btn_wrap">
                              <button
                                type="button"
                                className="remove"
                                disabled={isDeleting}
                                onClick={() => handleRemove(item)}
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                className="edit"
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="colB">
              <div className="product_wrapper">
                {cartItems.map((item: any) => {
                  const mrp = Number(item.productMRP) || Number(item.price);
                  return (
                    <div className="product_col" key={item.cartId}>
                      <figure>
                        <Image
                          src={
                            item.productImage || "/images/other/cart-product.jpg"
                          }
                          width={95}
                          height={85}
                          alt={item.productName || "product-img"}
                        />
                      </figure>
                      <figcaption>
                        <h6>{item.productName}</h6>
                        <div className="price_wrap">
                          <p className="sp">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </p>
                          {mrp > Number(item.price) && (
                            <p className="mrp">₹{mrp.toLocaleString("en-IN")}</p>
                          )}
                        </div>
                      </figcaption>
                    </div>
                  );
                })}
              </div>
              <p className="total_products">
                Price Details {`(${cartItems.length} Items)`}
              </p>
              <CheckoutTotalList
                buttonText={isPlacing || isPaying || isUpdatingPayment ? "Processing..." : "Place Order"}
                classname="shipping-total"
                items={checkoutItems}
                onPlaceOrder={handlePlaceOrder}
                disabled={isPlacing || isPaying || isUpdatingPayment}
              />
            </div>
          </div>
          <CheckoutBottom data={BankListData} />
        </div>
      </div>
    </section>
  );
}