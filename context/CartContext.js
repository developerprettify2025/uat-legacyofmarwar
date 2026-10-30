"use client";
import { toast } from "react-hot-toast";
import { createContext, useContext, useEffect, useState } from "react";

/** @type {import("react").Context<any>} */
const CartContext = createContext(null);

// Provider ke bahar use hua to clear error aayega
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};

// Same product + same color = same row
const makeCartId = (item) => `${item.productID}-${item.colorID}`;

const round2 = (n) => Number(Number(n).toFixed(2));

// GST included amount me se GST nikalo: GST = amount x rate / (100 + rate)
const gstFromInclusive = (amount, rate) =>
  round2((amount * rate) / (100 + rate));

// SHIPPING: har 500g par additional_rate (amount GST included maana hai)
const calculateShippingRates = (weight, standard_rate, additional_rate) => {
  const weightUnits = Math.ceil(weight / 500);
  return weightUnits < 1
    ? standard_rate
    : standard_rate + (weightUnits - 1) * additional_rate;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Page load par localStorage se cart + coupon lao
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      const storedCoupon = localStorage.getItem("appliedCoupon");
      const storedDiscount = localStorage.getItem("discount");

      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        // purane format (sizes / dummy data) ko ignore karo
        if (Array.isArray(parsed)) {
          setCartItems(parsed.filter((i) => i && i.cartId && i.quantity));
        }
      }
      if (storedCoupon) setAppliedCoupon(JSON.parse(storedCoupon));
      if (storedDiscount) setDiscount(Number(storedDiscount));
    } catch {}
    setLoaded(true);
  }, []);

  // Save cart
  useEffect(() => {
    if (loaded) localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems, loaded]);

  // Save coupon
  useEffect(() => {
    if (!loaded) return;
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon, loaded]);

  // Save discount
  useEffect(() => {
    if (loaded) localStorage.setItem("discount", String(discount));
  }, [discount, loaded]);

  // Cart me koi bhi change (add / remove / update) hone par coupon hata do
  const resetCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  // ADD: same product + color ho to quantity badhegi (latest price ke saath), warna nayi row
  const addToCart = (newItem) => {
    const cartId = makeCartId(newItem);
    const qty = Number(newItem.quantity) || 1;

    setCartItems((prev) => {
      const found = prev.find((i) => i.cartId === cartId);

      if (found) {
        return prev.map((i) =>
          i.cartId === cartId
            ? {
                ...i,
                quantity: i.quantity + qty,
                price: Number(newItem.productPrice), // latest price
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...newItem,
          cartId,
          quantity: qty,
          price: Number(newItem.productPrice), // GST included
        },
      ];
    });
    resetCoupon();
    toast.success("Added to cart");
  };

  // DELETE
  const removeFromCart = (cartId) => {
    const exists = cartItems.some((i) => i.cartId === cartId);
    if (!exists) return toast.error("Item not found in cart");

    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
    resetCoupon();
    toast.success("Item removed from cart");
  };

  // UPDATE: quantity +1 / -1
  const updateQuantity = (cartId, change, MiniMumOrderQuantity = 1) => {
    const item = cartItems.find((i) => i.cartId === cartId);
    if (!item) return;

    if (item.quantity + change < MiniMumOrderQuantity) {
      return toast.error(`Minimum quantity is ${MiniMumOrderQuantity}`);
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.cartId === cartId ? { ...i, quantity: i.quantity + change } : i
      )
    );
    resetCoupon();
    toast.success("Quantity updated");
  };

  const clearCart = () => {
    setCartItems([]);
    resetCoupon();
  };

  // SUMMARY
  // Total = (price x qty) - coupon (+ shipping). GST sirf breakdown hai.
  const getCartSummary = (isShipping = false, customerShippingAddressData) => {
    const shippingGSTRate = 18;

    // 1) subTotal, qty aur shipping
    let totalQty = 0;
    let subTotal = 0; // GST included, coupon se pehle
    let shippingFee = 0; // GST included

    cartItems.forEach((item) => {
      subTotal += item.price * item.quantity;
      totalQty += item.quantity;

      const weight = (item.ProductWeight || 0) * item.quantity;
      shippingFee += calculateShippingRates(
        weight,
        customerShippingAddressData?.standard_rate || 0,
        customerShippingAddressData?.additional_rate || 0
      );
    });
    subTotal = round2(subTotal);

    // 2) Coupon (tabhi lagega jab user ne lagaya ho aur valid ho)
    let couponCode = "";
    let couponDiscount = 0;

    if (
      appliedCoupon &&
      subTotal >= Number(appliedCoupon.CouponMinAmount || 0) &&
      // expiry wale din bhi coupon chalega
      new Date() <= new Date(`${appliedCoupon.CouponExpiryDate}T23:59:59`)
    ) {
      if (appliedCoupon.CouponType === "Percentage") {
        couponDiscount = (subTotal * Number(appliedCoupon.CouponValue)) / 100;
      } else {
        // "Fixed Amount" (DB value)
        couponDiscount = Number(appliedCoupon.CouponValue);
      }
      couponCode = appliedCoupon.CouponCode;
    }
    couponDiscount = round2(Math.min(couponDiscount, subTotal)); // subTotal se zyada nahi

    const afterDiscount = round2(subTotal - couponDiscount);

    // 3) GST: coupon ke baad wali amount me se nikalo (discount har item par barabar baanta)
    let productGST = 0;
    const ratio = subTotal > 0 ? afterDiscount / subTotal : 1;

    const items = cartItems.map((item) => {
      const gstRate = Number(item.productGSTRate ?? 12);
      const lineMRP = item.price * item.quantity; // coupon se pehle
      const lineTotal = round2(lineMRP * ratio); // coupon ke baad
      const lineGST = gstFromInclusive(lineTotal, gstRate);

      productGST += lineGST;

      return {
        cartId: item.cartId,
        gstRate,
        lineMRP,
        lineTotal, // GST included, coupon ke baad
        lineGST,
        lineBase: round2(lineTotal - lineGST), // GST ke bina
      };
    });

    productGST = round2(productGST);
    const basePrice = round2(afterDiscount - productGST);

    const shippingGST = gstFromInclusive(shippingFee, shippingGSTRate);
    const shippingBase = round2(shippingFee - shippingGST);

    const TotalGST = round2(productGST + (isShipping ? shippingGST : 0));
    const total = round2(afterDiscount + (isShipping ? shippingFee : 0));

    return {
      items, // per-item breakdown
      totalQty,
      totalMRP: subTotal, // coupon se pehle (GST included)
      couponCode,
      couponDiscount,
      discountOnMRP: couponDiscount,
      afterDiscount, // coupon ke baad product total
      basePrice, // GST ke bina
      productGST, // included GST
      subTotal: afterDiscount, // purane code se compatible
      shippingBase,
      shippingGST,
      shippingFee,
      TotalGST,
      total, // final payable
    };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loaded,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartSummary,
        appliedCoupon,
        setAppliedCoupon,
        discount,
        setDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
