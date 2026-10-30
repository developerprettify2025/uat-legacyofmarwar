"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetCustomerByIdQuery,
  useSaveCustomerMutation,
} from "../../../../store/backendSlice/customerAPISlice";
import {
  useDeleteCustomerShippingAddressMutation,
  useGetCustomerShippingAddressesQuery,
  useSaveCustomerShippingAddressMutation,
} from "../../../../store/backendSlice/customerShippingAddressAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyAddress = {
  CustomerShippingAddressName: "",
  CustomerShippingAddressPhoneNo: "",
  CustomerShippingAddressEmailID: "",
  CustomerShippingAddressPinCode: "",
  CustomerShippingAddressFullAddress: "",
  CustomerShippingAddressLocality: "",
  CustomerShippingAddressCity: "",
  CustomerShippingAddressState: "",
};

export default function AddUpdateCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const CustomerID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: customerResponse, isError: customerLoadError } = useGetCustomerByIdQuery(CustomerID, {
    skip: !CustomerID,
    refetchOnMountOrArgChange: true,
  });
  const [saveCustomer, { isLoading }] = useSaveCustomerMutation();
  const {
    data: addressResponse,
    isLoading: addressesLoading,
    isError: addressesLoadError,
  } = useGetCustomerShippingAddressesQuery(CustomerID, { skip: !CustomerID });
  const [saveAddress, { isLoading: isSavingAddress }] =
    useSaveCustomerShippingAddressMutation();
  const [deleteAddress, { isLoading: isDeletingAddress }] =
    useDeleteCustomerShippingAddressMutation();
  const [formData, setFormData] = useState({
    CustomerName: "",
    CustomerEmailID: "",
    CustomerPhoneNo: "",
    GoogleLoginID: "",
    FacebookLoginID: "",
    ActiveStatus: true,
  });
  const [customerImageFile, setCustomerImageFile] = useState(null);
  const [customerImagePreview, setCustomerImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressID, setEditingAddressID] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.PageID !== 0) {
      const canEdit = CustomerID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (canEdit !== 1) {
        toast.error(`You do not have permission to ${CustomerID ? "edit" : "add"} customers.`);
        router.push("/legacy-of-marwar-admin/manage-customer");
      }
    }
  }, [checkData?.loggedIn, pagePermission, CustomerID, router]);

  useEffect(() => {
    if (customerResponse?.success) {
      const customer = customerResponse.data;
      setFormData({
        CustomerName: customer.CustomerName || "",
        CustomerEmailID: customer.CustomerEmailID || "",
        CustomerPhoneNo: customer.CustomerPhoneNo || "",
        GoogleLoginID: customer.GoogleLoginID || "",
        FacebookLoginID: customer.FacebookLoginID || "",
        ActiveStatus: Number(customer.ActiveStatus) === 1,
      });
      const customerImage = customer.CustomerImage || "";
      setCustomerImagePreview(
        !customerImage
          ? ""
          : /^https?:\/\//i.test(customerImage) || customerImage.startsWith("/")
            ? customerImage
            : `/OnlineImages/CustomerImages/${encodeURIComponent(customerImage)}`,
      );
    }
  }, [customerResponse]);

  useEffect(() => {
    if (!customerImageFile) return undefined;
    const imageUrl = URL.createObjectURL(customerImageFile);
    setCustomerImagePreview(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [customerImageFile]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleAddressChange = (field, value) => {
    setAddressForm((previous) => ({ ...previous, [field]: value }));
    setAddressErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleAddressEdit = (address) => {
    setEditingAddressID(address.CustomerShippingAddressID);
    setAddressForm({
      CustomerShippingAddressName: address.CustomerShippingAddressName || "",
      CustomerShippingAddressPhoneNo: address.CustomerShippingAddressPhoneNo || "",
      CustomerShippingAddressEmailID: address.CustomerShippingAddressEmailID || "",
      CustomerShippingAddressPinCode: String(address.CustomerShippingAddressPinCode || ""),
      CustomerShippingAddressFullAddress: address.CustomerShippingAddressFullAddress || "",
      CustomerShippingAddressLocality: address.CustomerShippingAddressLocality || "",
      CustomerShippingAddressCity: address.CustomerShippingAddressCity || "",
      CustomerShippingAddressState: address.CustomerShippingAddressState || "",
    });
    setAddressErrors({});
  };

  const resetAddressForm = () => {
    setEditingAddressID(null);
    setAddressForm(emptyAddress);
    setAddressErrors({});
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(
      Object.entries(addressForm).map(([key, value]) => [key, value.trim()]),
    );
    const nextErrors = {};
    Object.entries(values).forEach(([field, value]) => {
      if (!value) nextErrors[field] = "This field is required.";
    });
    if (
      values.CustomerShippingAddressEmailID &&
      !emailPattern.test(values.CustomerShippingAddressEmailID)
    ) {
      nextErrors.CustomerShippingAddressEmailID = "Enter a valid email address.";
    }
    if (
      values.CustomerShippingAddressPinCode &&
      !/^\d+$/.test(values.CustomerShippingAddressPinCode)
    ) {
      nextErrors.CustomerShippingAddressPinCode = "Enter numbers only.";
    }
    if (Object.keys(nextErrors).length) {
      setAddressErrors(nextErrors);
      return;
    }
    try {
      const result = await saveAddress({
        ...values,
        CustomerID: Number(CustomerID),
        ...(editingAddressID
          ? { CustomerShippingAddressID: editingAddressID }
          : {}),
        UpdatedBy: checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
      }).unwrap();
      toast.success(result.message);
      resetAddressForm();
    } catch (error) {
      toast.error(error?.data?.message || "Could not save shipping address.");
    }
  };

  const handleAddressDelete = async (addressID) => {
    if (!window.confirm("Delete this shipping address?")) return;
    try {
      const result = await deleteAddress({
        CustomerID: Number(CustomerID),
        CustomerShippingAddressID: addressID,
      }).unwrap();
      toast.success(result.message);
      if (editingAddressID === addressID) resetAddressForm();
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete shipping address.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const name = formData.CustomerName.trim();
    const email = formData.CustomerEmailID.trim();
    const phone = formData.CustomerPhoneNo.trim();
    if (!name) nextErrors.CustomerName = "Customer name is required.";
    if (!email) nextErrors.CustomerEmailID = "Customer email is required.";
    else if (!emailPattern.test(email)) nextErrors.CustomerEmailID = "Enter a valid email address.";
    if (!phone) nextErrors.CustomerPhoneNo = "Customer phone number is required.";
    if (
      customerImageFile &&
      !["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"].includes(
        customerImageFile.type,
      )
    ) {
      nextErrors.CustomerImage = "Choose a valid image file.";
    } else if (customerImageFile && customerImageFile.size > 10 * 1024 * 1024) {
      nextErrors.CustomerImage = "Image must be 10 MB or smaller.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    payload.append("CustomerName", name);
    payload.append("CustomerEmailID", email.toLowerCase());
    payload.append("CustomerPhoneNo", phone);
    payload.append("GoogleLoginID", formData.GoogleLoginID.trim());
    payload.append("FacebookLoginID", formData.FacebookLoginID.trim());
    payload.append("ActiveStatus", formData.ActiveStatus ? "1" : "0");
    payload.append(
      "UpdatedBy",
      checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
    );
    if (customerImageFile) payload.append("CustomerImage", customerImageFile);
    if (CustomerID) payload.append("CustomerID", String(Number(CustomerID)));

    try {
      const response = await saveCustomer(payload).unwrap();
      if (!response.success) {
        toast.error(response.message || "Could not save customer.");
        return;
      }
      toast.success(response.message);
      if (!CustomerID && response.CustomerID) {
        router.replace(
          `/legacy-of-marwar-admin/addupd-customer?ID=${response.CustomerID}`,
        );
      }
    } catch (error) {
      toast.error(error?.data?.message || "Could not save customer.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>{CustomerID ? "Update Customer" : "Add Customer"}</h1>
            <p>Name, email, and phone number are required. Email and phone must be unique.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-customer">
            Back to Customers
          </Link>
        </div>
        {customerLoadError && (
          <p className={styles.loadError}>Unable to load this customer. It may have been deleted.</p>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="customerName">Customer Name*</label>
            <input
              id="customerName"
              value={formData.CustomerName}
              onChange={(event) => handleChange("CustomerName", event.target.value)}
              maxLength={500}
              required
            />
            {errors.CustomerName && <span className={styles.error}>{errors.CustomerName}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="customerEmail">Customer Email*</label>
              <input
                id="customerEmail"
                type="email"
                autoComplete="email"
                value={formData.CustomerEmailID}
                onChange={(event) => handleChange("CustomerEmailID", event.target.value)}
                maxLength={500}
                required
              />
              {errors.CustomerEmailID && <span className={styles.error}>{errors.CustomerEmailID}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="customerPhone">Customer Phone*</label>
              <input
                id="customerPhone"
                type="tel"
                autoComplete="tel"
                value={formData.CustomerPhoneNo}
                onChange={(event) => handleChange("CustomerPhoneNo", event.target.value)}
                maxLength={50}
                required
              />
              {errors.CustomerPhoneNo && <span className={styles.error}>{errors.CustomerPhoneNo}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="customerImage">Customer Image</label>
            <input
              id="customerImage"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              onChange={(event) => {
                setCustomerImageFile(event.target.files?.[0] || null);
                setErrors((previous) => ({ ...previous, CustomerImage: "" }));
              }}
            />
            <span className={styles.helpText}>JPEG, PNG, GIF, WebP, or AVIF; maximum 10 MB.</span>
            {customerImagePreview && (
              <img
                className={styles.imagePreview}
                src={customerImagePreview}
                alt="Customer image preview"
              />
            )}
            {errors.CustomerImage && <span className={styles.error}>{errors.CustomerImage}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="googleLoginId">Google Login ID</label>
              <input
                id="googleLoginId"
                value={formData.GoogleLoginID}
                onChange={(event) => handleChange("GoogleLoginID", event.target.value)}
                maxLength={500}
                readOnly
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="facebookLoginId">Facebook Login ID</label>
              <input
                id="facebookLoginId"
                value={formData.FacebookLoginID}
                onChange={(event) => handleChange("FacebookLoginID", event.target.value)}
                maxLength={500}
                readOnly
              />
            </div>
          </div>

          <label className={styles.status}>
            <input
              type="checkbox"
              checked={formData.ActiveStatus}
              onChange={(event) => handleChange("ActiveStatus", event.target.checked)}
            />
            Active
          </label>

          <div className={styles.actions}>
            <button className={styles.submitButton} type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : CustomerID ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
        {CustomerID && (
          <section className={styles.addressSection}>
            <div className={styles.addressHeading}>
              <div>
                <h2>Shipping Addresses</h2>
                <p>Manage multiple delivery addresses for this customer.</p>
              </div>
              <span className={styles.addressCount}>
                {addressResponse?.data?.length || 0} saved
              </span>
            </div>

            {addressesLoadError && (
              <p className={styles.loadError}>Unable to load shipping addresses.</p>
            )}
            {addressesLoading ? (
              <p className={styles.addressMessage}>Loading addresses...</p>
            ) : addressResponse?.data?.length ? (
              <div className={styles.addressList}>
                {addressResponse.data.map((address) => (
                  <article
                    className={styles.addressCard}
                    key={address.CustomerShippingAddressID}
                  >
                    <div className={styles.addressCardContent}>
                      <h3>{address.CustomerShippingAddressName}</h3>
                      <p>
                        {address.CustomerShippingAddressPhoneNo} ·{" "}
                        {address.CustomerShippingAddressEmailID}
                      </p>
                      <p>{address.CustomerShippingAddressFullAddress}</p>
                      <p>
                        {address.CustomerShippingAddressLocality},{" "}
                        {address.CustomerShippingAddressCity},{" "}
                        {address.CustomerShippingAddressState} -{" "}
                        {address.CustomerShippingAddressPinCode}
                      </p>
                    </div>
                    <div className={styles.addressActions}style={{ display: "none" }}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => handleAddressEdit(address)}
                        disabled={isDeletingAddress}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        type="button"
                        onClick={() =>
                          handleAddressDelete(address.CustomerShippingAddressID)
                        }
                        disabled={isDeletingAddress}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.addressMessage}>No shipping addresses have been added.</p>
            )}

            <form style={{ display: "none" }} className={styles.addressForm} onSubmit={handleAddressSubmit} noValidate>
              <h3>{editingAddressID ? "Update Address" : "Add Shipping Address"}</h3>
              <div className={styles.addressFields}>
                {[
                  ["CustomerShippingAddressName", "Recipient Name", 255],
                  ["CustomerShippingAddressPhoneNo", "Phone Number", 255],
                  ["CustomerShippingAddressEmailID", "Email Address", 255],
                  ["CustomerShippingAddressPinCode", "PIN Code", 10],
                  ["CustomerShippingAddressFullAddress", "Full Address", 255],
                  ["CustomerShippingAddressLocality", "Locality", 100],
                  ["CustomerShippingAddressCity", "City", 100],
                  ["CustomerShippingAddressState", "State", 100],
                ].map(([field, label, maxLength]) => (
                  <div
                    className={`${styles.field} ${
                      field === "CustomerShippingAddressFullAddress"
                        ? styles.fullWidth
                        : ""
                    }`}
                    key={field}
                  >
                    <label htmlFor={field}>{label}*</label>
                    {field === "CustomerShippingAddressFullAddress" ? (
                      <textarea
                        id={field}
                        value={addressForm[field]}
                        onChange={(event) => handleAddressChange(field, event.target.value)}
                        maxLength={maxLength}
                        rows={3}
                        required
                      />
                    ) : (
                      <input
                        id={field}
                        type={
                          field === "CustomerShippingAddressEmailID"
                            ? "email"
                            : field === "CustomerShippingAddressPinCode"
                              ? "text"
                              : "text"
                        }
                        inputMode={
                          field === "CustomerShippingAddressPinCode" ? "numeric" : undefined
                        }
                        value={addressForm[field]}
                        onChange={(event) =>
                          handleAddressChange(field, event.target.value)
                        }
                        maxLength={maxLength}
                        required
                      />
                    )}
                    {addressErrors[field] && (
                      <span className={styles.error}>{addressErrors[field]}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.addressFormActions}>
                <button
                  className={styles.submitButton}
                  type="submit"
                  disabled={isSavingAddress}
                >
                  {isSavingAddress
                    ? "Saving..."
                    : editingAddressID
                      ? "Update Address"
                      : "Add Address"}
                </button>
                {editingAddressID && (
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={resetAddressForm}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
