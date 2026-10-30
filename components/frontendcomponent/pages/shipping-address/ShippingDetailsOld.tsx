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
import Button from "../../atoms/Button";
import CheckoutBottom from "../../molecules/CheckoutBottom";
import CheckoutTotalList from "../../molecules/CheckoutTotalList";

const NEXT_PAGE_URL = "/check-out"; // payment page ka route
const CART_URL = "/shopping-cart";
const SELECTED_ADDRESS_KEY = "selectedShippingAddress";
const DEFAULT_ADDRESS_KEY = "defaultShippingAddressID";

const BankListData = Array.from({ length: 9 }, (_, i) => ({
  imgSrc: `/images/checkout/payment${i + 1}.png`,
}));

export default function ShippingDetailsOld() {
  const router = useRouter();
  const { openModal } = useModal();

  // ---------- hooks (sab return se pehle) ----------
  const { cartItems, loaded, getCartSummary } = useCart();

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

  const addresses: any[] = addressRes?.data ?? [];
  const [selectedID, setSelectedID] = useState<number | null>(null);

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
        // 2) pehle Continue dabaya tha wo address
        const saved = JSON.parse(
          localStorage.getItem(SELECTED_ADDRESS_KEY) || "null",
        );
        const savedID = Number(saved?.CustomerShippingAddressID);
        if (savedID && exists(savedID)) return savedID;

        // 3) default address
        const defaultID = Number(localStorage.getItem(DEFAULT_ADDRESS_KEY) || 0);
        if (defaultID && exists(defaultID)) return defaultID;
      } catch {}

      // 4) warna pehla address
      return Number(addresses[0].CustomerShippingAddressID);
    });
  }, [addresses]);

  // ---------- guards ----------
  if (loaded === false) return null;

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

  const handleContinue = () => {
    if (CustomerID < 1) return openModal("loginPop");

    const selected = addresses.find(
      (a) => Number(a.CustomerShippingAddressID) === selectedID,
    );
    if (!selected) return toast.error("Please select a delivery address");

    // payment page isi se address padhega
    try {
      localStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(selected));
    } catch {}
    router.push(NEXT_PAGE_URL);
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
                buttonText="continue"
                classname="shipping-total"
                items={checkoutItems}
                onPlaceOrder={handleContinue}
              />
            </div>
          </div>
          <CheckoutBottom data={BankListData} />
        </div>
      </div>
    </section>
  );
}