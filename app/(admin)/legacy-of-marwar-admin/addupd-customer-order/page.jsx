"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useCreateCustomerOrderMutation,
  useGetCustomerOrderAddressesQuery,
  useGetOrderFormDataQuery,
} from "../../../../store/backendSlice/customerOrderAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const emptyItem = { ProductColorID: "", ProductQuantity: "1" };
const currency = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function AddCustomerOrderPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: formResponse, isLoading: formLoading, isError: formError } =
    useGetOrderFormDataQuery();
  const [createOrder, { isLoading: isSaving }] = useCreateCustomerOrderMutation();
  const [customerID, setCustomerID] = useState("");
  const [addressID, setAddressID] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [errors, setErrors] = useState({});

  const { data: addressResponse, isLoading: addressesLoading } =
    useGetCustomerOrderAddressesQuery(customerID, { skip: !customerID });

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.PageID !== 0 && pagePermission.CanAdd !== 1) {
      toast.error("You do not have permission to add orders.");
      router.push("/legacy-of-marwar-admin/manage-customer-order");
    }
  }, [checkData, pagePermission, router]);

  const customers = formResponse?.data?.customers || [];
  const products = formResponse?.data?.products || [];
  const addresses = addressResponse?.data || [];
  const statuses = formResponse?.data?.orderStatuses || [];
  const paymentStatuses = formResponse?.data?.paymentStatuses || [];
  const productsByVariantID = useMemo(
    () => new Map(products.map((product) => [String(product.ProductColorID), product])),
    [products],
  );
  const orderTotal = items.reduce((total, item) => {
    const product = productsByVariantID.get(String(item.ProductColorID));
    const quantity = Number(item.ProductQuantity) || 0;
    return total + (Number(product?.ProductSalePrice) || 0) * quantity;
  }, 0);

  const updateItem = (index, field, value) => {
    setItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!customerID) nextErrors.CustomerID = "Select a customer.";
    if (!addressID) nextErrors.CustomerShippingAddressID = "Select a shipping address.";
    if (!items.length) nextErrors.items = "Add at least one product.";
    items.forEach((item, index) => {
      if (!item.ProductColorID) nextErrors[`product-${index}`] = "Select a product.";
      if (!Number.isInteger(Number(item.ProductQuantity)) || Number(item.ProductQuantity) < 1) {
        nextErrors[`quantity-${index}`] = "Quantity must be at least one.";
      }
    });
    const selectedVariants = items.map((item) => item.ProductColorID).filter(Boolean);
    if (new Set(selectedVariants).size !== selectedVariants.length) {
      nextErrors.items = "Each product variant can only be added once; update its quantity instead.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      const response = await createOrder({
        CustomerID: Number(customerID),
        CustomerShippingAddressID: Number(addressID),
        items: items.map((item) => ({
          ProductColorID: Number(item.ProductColorID),
          ProductQuantity: Number(item.ProductQuantity),
        })),
        OrderStatus: orderStatus,
        TransactionStatus: paymentStatus,
        UpdatedBy: checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
      }).unwrap();
      toast.success(
        response.TransactionID
          ? `${response.message} Order No. ${response.OrderNo}. Transaction ID: ${response.TransactionID}`
          : `${response.message} Order No. ${response.OrderNo}`,
      );
      router.push("/legacy-of-marwar-admin/manage-customer-order");
    } catch (error) {
      toast.error(error?.data?.message || "Could not create order.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>Add Customer Order</h1>
            <p>Select a customer, saved delivery address, and product items.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-customer-order">
            Back to Orders
          </Link>
        </div>

        {formError && (
          <p className={styles.errorBanner}>Unable to load customers and products. Please refresh.</p>
        )}
        {formLoading ? (
          <p className={styles.loading}>Loading order data...</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <section className={styles.section}>
              <h2>Customer & Shipping Address</h2>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="customer">Customer*</label>
                  <select
                    id="customer"
                    value={customerID}
                    onChange={(event) => {
                      setCustomerID(event.target.value);
                      setAddressID("");
                      setErrors((previous) => ({
                        ...previous,
                        CustomerID: "",
                        CustomerShippingAddressID: "",
                      }));
                    }}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.CustomerID} value={customer.CustomerID}>
                        {customer.CustomerName} — {customer.CustomerPhoneNo}
                      </option>
                    ))}
                  </select>
                  {errors.CustomerID && <span className={styles.error}>{errors.CustomerID}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="shippingAddress">Shipping Address*</label>
                  <select
                    id="shippingAddress"
                    value={addressID}
                    onChange={(event) => {
                      setAddressID(event.target.value);
                      setErrors((previous) => ({
                        ...previous,
                        CustomerShippingAddressID: "",
                      }));
                    }}
                    disabled={!customerID || addressesLoading}
                    required
                  >
                    <option value="">
                      {addressesLoading ? "Loading addresses..." : "Select shipping address"}
                    </option>
                    {addresses.map((address) => (
                      <option
                        key={address.CustomerShippingAddressID}
                        value={address.CustomerShippingAddressID}
                      >
                        {address.CustomerShippingAddressName} — {address.CustomerShippingAddressCity},{" "}
                        {address.CustomerShippingAddressPinCode}
                      </option>
                    ))}
                  </select>
                  {errors.CustomerShippingAddressID && (
                    <span className={styles.error}>{errors.CustomerShippingAddressID}</span>
                  )}
                  {customerID && !addressesLoading && !addresses.length && (
                    <span className={styles.helpText}>
                      This customer has no saved address. Add one from the customer profile first.
                    </span>
                  )}
                </div>
              </div>
              {addresses.find(
                (address) => String(address.CustomerShippingAddressID) === addressID,
              ) && (
                <div className={styles.addressPreview}>
                  {(() => {
                    const selectedAddress = addresses.find(
                      (address) => String(address.CustomerShippingAddressID) === addressID,
                    );
                    return (
                      <>
                        <strong>{selectedAddress.CustomerShippingAddressName}</strong>
                        <span>{selectedAddress.CustomerShippingAddressPhoneNo}</span>
                        <span>
                          {[
                            selectedAddress.CustomerShippingAddressFullAddress,
                            selectedAddress.CustomerShippingAddressLocality,
                            selectedAddress.CustomerShippingAddressCity,
                            selectedAddress.CustomerShippingAddressState,
                            selectedAddress.CustomerShippingAddressPinCode,
                          ].filter(Boolean).join(", ")}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>Order Products</h2>
                <button
                  className={styles.addItemButton}
                  type="button"
                  onClick={() => setItems((previous) => [...previous, { ...emptyItem }])}
                  disabled={items.length >= 50}
                >
                  Add Product
                </button>
              </div>
              {!products.length ? (
                <p className={styles.helpText}>No active product variants with prices are available.</p>
              ) : (
                <div className={styles.itemList}>
                  {items.map((item, index) => {
                    const product = productsByVariantID.get(String(item.ProductColorID));
                    const selectedVariantIDs = new Set(
                      items
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((other) => String(other.ProductColorID)),
                    );
                    return (
                      <div className={styles.itemRow} key={index}>
                        <div className={styles.field}>
                          <label htmlFor={`product-${index}`}>Product / Variant*</label>
                          <select
                            id={`product-${index}`}
                            value={item.ProductColorID}
                            onChange={(event) =>
                              updateItem(index, "ProductColorID", event.target.value)
                            }
                            required
                          >
                            <option value="">Select product</option>
                            {products.map((option) => (
                              <option
                                key={option.ProductColorID}
                                value={option.ProductColorID}
                                disabled={selectedVariantIDs.has(String(option.ProductColorID))}
                              >
                                {option.ProductName}
                                {option.ColorName ? ` — ${option.ColorName}` : ""}
                                {" — "}{currency(option.ProductSalePrice)}
                              </option>
                            ))}
                          </select>
                          {errors[`product-${index}`] && (
                            <span className={styles.error}>{errors[`product-${index}`]}</span>
                          )}
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={`quantity-${index}`}>Quantity*</label>
                          <input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={item.ProductQuantity}
                            onChange={(event) =>
                              updateItem(index, "ProductQuantity", event.target.value)
                            }
                            required
                          />
                          {errors[`quantity-${index}`] && (
                            <span className={styles.error}>{errors[`quantity-${index}`]}</span>
                          )}
                        </div>
                        <div className={styles.itemPrice}>
                          <span>Line Total</span>
                          <strong>
                            {currency((Number(product?.ProductSalePrice) || 0) * Number(item.ProductQuantity || 0))}
                          </strong>
                        </div>
                        {items.length > 1 && (
                          <button
                            className={styles.removeItemButton}
                            type="button"
                            aria-label={`Remove product row ${index + 1}`}
                            onClick={() =>
                              setItems((previous) =>
                                previous.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.items && <span className={styles.error}>{errors.items}</span>}
              <div className={styles.orderTotal}>
                <span>Order Total</span>
                <strong>{currency(orderTotal)}</strong>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Order & Payment Status</h2>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="orderStatus">Order Status*</label>
                  <select
                    id="orderStatus"
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                  >
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="paymentStatus">Payment Status*</label>
                  <select
                    id="paymentStatus"
                    value={paymentStatus}
                    onChange={(event) => setPaymentStatus(event.target.value)}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className={styles.actions}>
              <button className={styles.submitButton} type="submit" disabled={isSaving || formError}>
                {isSaving ? "Creating Order..." : "Create Order"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
