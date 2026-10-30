"use client";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import DashboardNav from "../../organisms/DashboardNav";
import "@/uploads/sass/dashboard/dashboard.css";
import Button from "../../atoms/Button";
import { useGetCustomerOrderDetailQuery } from "@/store/backendSlice/customerOrderAPISlice";
import { toast } from "react-hot-toast";
import { downloadInvoice } from "@/utils/downloadInvoice";

const ORDERS_URL = "/my-order"; // orders list page ka route

// tracking steps: (API status) -> (label)
const TRACK_STEPS = [
  { status: "Confirmed", label: "Order Confirmed" },
  { status: "Packed", label: "Packed" },
  { status: "Shipped", label: "Shipped" },
  { status: "Delivered", label: "Delivered" },
];
const STATUS_RANK: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Processing: 1,
  Packed: 2,
  Shipped: 3,
  Delivered: 4,
};

const money = (n: number) => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string | null, withDay = false) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    ...(withDay ? { weekday: "short" } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const orderNo = Number(
    searchParams.get("orderno") ?? searchParams.get("orderNo") ?? 0,
  );

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

  const validOrderNo = Number.isInteger(orderNo) && orderNo > 0;

  const {
    data: res,
    isLoading,
    isError,
    error,
  } = useGetCustomerOrderDetailQuery(
    { CustomerID, OrderNo: orderNo },
    { skip: CustomerID < 1 || !validOrderNo },
  );
  const order: any = res?.data;

  const handleInvoice = async () => {
    try {
      await downloadInvoice(order);
    } catch (err) {
      console.error("Invoice error:", err);
      toast.error("Could not generate invoice");
    }
  };

  // ---------- states ----------
  let message = "";
  if (!validOrderNo) message = "Invalid order number.";
  else if (CustomerID < 1) message = "Please login to track your order.";
  else if (isLoading) message = "Loading order details...";
  else if (isError) {
    message =
      (error as any)?.status === 404
        ? "Order not found."
        : "Could not load order details. Please try again.";
  } else if (!order) message = "Order not found.";

  const wrap = (content: React.ReactNode) => (
    <main>
      <section>
        <div className="dashboard-secA order-details sec-pad-all">
          <div className="container">
            <div className="flex main_wrapper">
              <DashboardNav />
              <div className="aside-right orderD-right">
                <div className="aside-right-wrap">
                  <Link href={ORDERS_URL} className="back2order">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="#000"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14 7l-5 5l5 5"
                        strokeWidth={1}
                      ></path>
                    </svg>{" "}
                    Back to orders
                  </Link>
                  {content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );

  if (message) return wrap(<p style={{ padding: "24px 0" }}>{message}</p>);

  // ---------- derived data ----------
  const items: any[] = order.items ?? [];
  const history: any[] = order.statusHistory ?? [];
  const isCancelled = order.OrderStatus === "Cancelled";

  // cancelled ho to wahi tak ka progress dikhao jahan tak pahunche the
  const reachedRank = isCancelled
    ? Math.max(0, ...history.map((h) => STATUS_RANK[h.OrderStatus] ?? 0))
    : (STATUS_RANK[order.OrderStatus] ?? 0);

  const stepDate = (status: string) => {
    const entry = history.find((h) => h.OrderStatus === status);
    return formatDate(entry?.UpdatedOn, true);
  };

  const subTotal = items.reduce(
    (sum, i) => sum + Number(i.ProductTotalAmount || 0),
    0,
  );
  const couponDiscount = Number(order.CouponValue || 0);
  const shipping = Number(order.TotalShippingAmount || 0);
  const gst = Number(order.TotalGSTAmount || 0);

  const fullAddress = [
    order.OrderShippingAddressFullAddress,
    order.OrderShippingAddressLocality,
    order.OrderShippingAddressCity,
    order.OrderShippingAddressState,
    order.OrderShippingAddressPinCode,
  ]
    .filter(Boolean)
    .join(", ");

  return wrap(
    <>
      <div className="order_details_wrapper">
        <div className="order_id">
          <p className="id">{order.OrderNo}</p>
          <p>
            {order.DeliveryDate
              ? `Delivered on ${formatDate(order.DeliveryDate)}`
              : `Ordered on ${formatDate(order.OrderDate)}`}
          </p>
        </div>

        {isCancelled && (
          <p style={{ margin: "12px 0" }}>This order has been cancelled.</p>
        )}

        <div className="order_status">
          <ul className="order_time">
            {TRACK_STEPS.map((step, index) => (
              <li
                key={step.status}
                className={reachedRank >= index + 1 ? "active" : ""}
              >
                <span>{step.label}</span>
                <div className="dot"></div>
                <p>{stepDate(step.status)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="prod_content">
          {items.map((item, index) => (
            <div className="pro_item" key={`${item.ProductID}-${index}`}>
              <figure>
                <Image
                  src={
                    item.ProductImage
                      ? `/OnlineImages/ProductImages/${item.ProductImage}`
                      : "/images/other/ring1.png"
                  }
                  width="64"
                  height="70"
                  alt={item.ProductName || "Product Image"}
                ></Image>
              </figure>
              <div className="pro_details">
                <p className="pro_name">{item.ProductName}</p>
                {item.ColorName && (
                  <p className="color">
                    Color : <span>{item.ColorName}</span>
                  </p>
                )}
              </div>
              <div className="item_total">
                <div className="pro_price">
                  <p>Item Price</p>
                  <span>{money(item.ProductSalePrice)}</span>
                </div>
                <div className="quantity">
                  <p>Quantity</p>
                  <span>{item.ProductQuantity}</span>
                </div>
                <div className="total_price">
                  <p>Total</p>
                  <span>{money(item.ProductTotalAmount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="address_details">
          <div className="colA">
            <p className="title">Delivery Address</p>
            <p className="user_name">{order.OrderShippingAddressName}</p>
            <p className="address">{fullAddress}</p>
            {order.OrderShippingAddressPhoneNo && (
              <p>
                Mobile:{" "}
                <Link href={`tel:${order.OrderShippingAddressPhoneNo}`}>
                  {order.OrderShippingAddressPhoneNo}
                </Link>
              </p>
            )}
          </div>
          <div className="colB">
            <p className="title">Order Summary</p>
            <ul className="summary_details">
              <li>
                <p>Subtotal</p>
                <span>{money(subTotal)}</span>
              </li>
              {couponDiscount > 0 && (
                <li>
                  <p>
                    Coupon Discount
                    {order.CouponCode ? ` (${order.CouponCode})` : ""}
                  </p>
                  <span>- {money(couponDiscount)}</span>
                </li>
              )}
              <li>
                <p>Shipping</p>
                <span>{shipping > 0 ? money(shipping) : "Free"}</span>
              </li>
              {gst > 0 && (
                <li>
                  <p>Total GST</p>
                  <span>{money(gst)}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="order_id_stats">
          <ul>
            <li>
              <p>Txn ID :</p>
              <span>{order.TransactionID || "-"}</span>
            </li>
            <li>
              <p>Status : </p>
              <span>{order.TransactionStatus}</span>
            </li>
          </ul>
          <p>
            Total Price <span>{money(order.OrderTotalAmount)}</span>
          </p>
        </div>
      </div>
      <div className="btn_wrapper">
        <Button
          buttonText="Get Invoice"
          classname="solid-primary"
          onClick={handleInvoice}
        />
      </div>
    </>,
  );
}

export default function OrderDetailPage() {
  // useSearchParams ko Suspense ke andar rakhna zaroori hai
  return (
    <Suspense fallback={null}>
      <OrderDetailContent />
    </Suspense>
  );
}
