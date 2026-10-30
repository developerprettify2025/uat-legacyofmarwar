"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, SyntheticEvent } from "react";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";
import CheckoutBottom from "../../molecules/CheckoutBottom";
import CheckoutTotalList from "../../molecules/CheckoutTotalList";
import type { CheckoutPricing } from "@/app/types/CheckoutPricing";
import { toast } from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { useApplyCouponMutation } from "@/store/backendSlice/couponAPISlice";
import { useSelector } from "react-redux";
import { useModal } from "@/hooks/useModal";
import NotFound from "../../organisms/NotFound";

const MIN_QTY = 1;
const MAX_QTY = 10;

interface Coupon {
  coupon: string;
}

const BankListData = Array.from({ length: 9 }, (_, i) => ({
  imgSrc: `/images/checkout/payment${i + 1}.png`,
}));

/* ---------- one cart row ---------- */

interface CartItemRowProps {
  item: any;
  onChangeQty: (cartId: string, change: number) => void;
  onRemove: (cartId: string) => void;
}

function CartItemRow({ item, onChangeQty, onRemove }: CartItemRowProps) {
  const { cartId, quantity } = item;
  const productUrl = item.productNameUrl
    ? `/${item.productNameUrl}`
    : "/products";

  // typing ke liye local draft, blur par cart me save hota hai
  const [draft, setDraft] = useState<string>(String(quantity));
  useEffect(() => setDraft(String(quantity)), [quantity]);

  const decrement = () => {
    if (quantity > MIN_QTY) onChangeQty(cartId, -1);
  };
  const increment = () => {
    if (quantity < MAX_QTY) onChangeQty(cartId, 1);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value.replace(/\D/g, ""));
  };

  const commitDraft = () => {
    const num = parseInt(draft, 10);
    const next = isNaN(num)
      ? quantity
      : Math.min(MAX_QTY, Math.max(MIN_QTY, num));
    setDraft(String(next));
    if (next !== quantity) onChangeQty(cartId, next - quantity);
  };

  const mrp = Number(item.productMRP) || Number(item.price);

  return (
    <div className="cart_col">
      <Link href={productUrl} className="figure">
        <Image
          src={item.productImage || "/images/other/cart-product.jpg"}
          width={120}
          height={120}
          alt={item.productName || "product"}
        />
      </Link>
      <figcaption>
        <Link href={productUrl} className="h6">
          {item.productName}
        </Link>
        <div className="options_wrap">
          {item.colorName && (
            <div className="color_col">
              <p>
                Color : <span>{item.colorName}</span>
              </p>
            </div>
          )}
          <div className="quantity_wrap">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= MIN_QTY}
              aria-label="Decrease quantity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={draft}
              onChange={handleInputChange}
              onBlur={commitDraft}
              onKeyDown={(e) => e.key === "Enter" && commitDraft()}
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={increment}
              disabled={quantity >= MAX_QTY}
              aria-label="Increase quantity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={2}
                  d="M12 20v-8m0 0V4m0 8h8m-8 0H4"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="lower-wrap">
          <div className="price_wrap">
            <p className="sp">₹{Number(item.price).toLocaleString("en-IN")}</p>
            {mrp > Number(item.price) && (
              <p className="mrp">₹{mrp.toLocaleString("en-IN")}</p>
            )}
          </div>
          <button
            type="button"
            className="wishlistBtn"
            onClick={() => onRemove(cartId)}
          >
            Remove
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              viewBox="0 0 1024 1024"
            >
              <path
                fill="currentColor"
                d="M160 256H96a32 32 0 0 1 0-64h256V96a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v96h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
              />
            </svg>
          </button>
        </div>
      </figcaption>
    </div>
  );
}

/* ---------- main component ---------- */
export default function CartDetails() {
  const { openModal } = useModal();
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
    ) || 0; // NaN / null / undefined sab 0 ho jayenge
  const [applyCoupon, { isLoading: isApplying }] = useApplyCouponMutation();
  const router = useRouter();
  const {
    cartItems,
    loaded,
    updateQuantity,
    removeFromCart,
    getCartSummary,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const handlePlaceOrder = () => {
    // login nahi hai -> popup kholo, aage mat jao
    if (CustomerID < 1) {
      openModal("loginPop");
      return;
    }
    router.push("/shipping-address");
  };
  const [formData, setFormData] = useState<Coupon>({ coupon: "" });

  // localStorage se cart aane tak kuch mat dikhao (warna "Cart not found" flash hota hai)
  if (loaded === false) return null;

  /* ---------- EMPTY CART ---------- */
  if (!cartItems || cartItems.length === 0) {
    return (
      <section>
        <div className="checkout-main sec-pad-all">
          <div className="container">
            <NotFound
              className="not-found2"
              desc="Your cart is empty. Add some products to continue."
              btn={true}
              buttonText="Continue Shopping"
              linkHref="/products"
            />
          </div>
        </div>
      </section>
    );
  }

  /* ---------- TOTALS ---------- */
  const summary = getCartSummary(false);

  // MRP (cut price) ka total
  const totalMrp = cartItems.reduce(
    (sum: number, i: any) =>
      sum + (Number(i.productMRP) || Number(i.price)) * i.quantity,
    0,
  );
  // selling price ka total (coupon se pehle)
  const totalSp = summary.totalMRP;

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

  const handleChange = (
    e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    const code = formData.coupon.trim();
    if (!code) return toast.error("Enter coupon code");

    try {
      const res = await applyCoupon({
        // sirf call
        CouponCode: code,
        CartAmount: summary.totalMRP,
      }).unwrap();

      setAppliedCoupon(res.data);
      toast.success(res.message || "Coupon applied");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to apply coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setFormData({ coupon: "" });
    toast.success("Coupon removed");
  };

  return (
    <section>
      <div className="checkout-main sec-pad-all">
        <div className="container">
          <div className="main_wrapper flex">
            <div className="colA">
              <div className="total">
                <p>
                  <span>{cartItems.length} </span>
                  {cartItems.length === 1 ? "Item" : "Items"}
                </p>
              </div>
              <div className="cart_list">
                {cartItems.map((item: any) => (
                  <CartItemRow
                    key={item.cartId}
                    item={item}
                    onChangeQty={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            </div>

            <div className="colB">
              <div className="coupon_section">
                <h6>Coupons</h6>
                <div className="coupon_wrap form">
                  <Input
                    type="text"
                    value={formData.coupon}
                    onChange={handleChange}
                    placeholder="Enter coupon code"
                    name="coupon"
                    id="coupon"
                  />
                  <Button
                    classname="primary-border"
                    buttonText="Apply"
                    onClick={handleApplyCoupon}
                  />
                  <p>
                    {summary.couponCode ? (
                      <>
                        Coupon <b>{summary.couponCode}</b> applied{" "}
                        <button type="button" onClick={handleRemoveCoupon}>
                          Remove
                        </button>
                      </>
                    ) : appliedCoupon ? (
                      "Coupon is not valid for this cart"
                    ) : null}
                  </p>
                </div>
              </div>
              <CheckoutTotalList
                items={checkoutItems}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          </div>
          <CheckoutBottom data={BankListData} />
        </div>
      </div>
    </section>
  );
}
