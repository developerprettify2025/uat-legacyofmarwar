"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetCouponByIdQuery,
  useSaveCouponMutation,
} from "../../../../store/backendSlice/couponAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const initialForm = {
  CouponName: "",
  CouponCode: "",
  CouponType: "Percentage",
  CouponValue: "",
  CouponMinAmount: "0",
  CouponStartDate: "",
  CouponExpiryDate: "",
  ActiveStatus: true,
};

const dateValue = (value) => (value ? String(value).slice(0, 10) : "");

export default function AddUpdateCouponPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const CouponID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: couponResponse, isError: couponLoadError } = useGetCouponByIdQuery(
    CouponID,
    { skip: !CouponID, refetchOnMountOrArgChange: true },
  );
  const [saveCoupon, { isLoading }] = useSaveCouponMutation();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.PageID !== 0) {
      const canEdit = CouponID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (canEdit !== 1) {
        toast.error(`You do not have permission to ${CouponID ? "edit" : "add"} coupons.`);
        router.push("/legacy-of-marwar-admin/manage-coupon");
      }
    }
  }, [checkData, pagePermission, CouponID, router]);

  useEffect(() => {
    if (couponResponse?.success) {
      const coupon = couponResponse.data;
      setFormData({
        CouponName: coupon.CouponName || "",
        CouponCode: coupon.CouponCode || "",
        CouponType: coupon.CouponType || "Percentage",
        CouponValue: String(coupon.CouponValue ?? ""),
        CouponMinAmount: String(coupon.CouponMinAmount ?? "0"),
        CouponStartDate: dateValue(coupon.CouponStartDate),
        CouponExpiryDate: dateValue(coupon.CouponExpiryDate),
        ActiveStatus: Number(coupon.ActiveStatus) === 1,
      });
    }
  }, [couponResponse]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const name = formData.CouponName.trim();
    const code = formData.CouponCode.trim().toUpperCase();
    const value = Number(formData.CouponValue);
    const minAmount = Number(formData.CouponMinAmount);

    if (!name) nextErrors.CouponName = "Coupon name is required.";
    if (!/^[A-Z0-9_-]{1,100}$/.test(code)) {
      nextErrors.CouponCode = "Use up to 100 letters, numbers, hyphens, or underscores.";
    }
    if (!Number.isInteger(value) || value < 1) {
      nextErrors.CouponValue = "Enter a whole number greater than zero.";
    } else if (formData.CouponType === "Percentage" && value > 100) {
      nextErrors.CouponValue = "Percentage discount cannot exceed 100.";
    }
    if (!Number.isInteger(minAmount) || minAmount < 0) {
      nextErrors.CouponMinAmount = "Enter a whole amount of zero or greater.";
    }
    if (!formData.CouponStartDate) {
      nextErrors.CouponStartDate = "Start date is required.";
    }
    if (!formData.CouponExpiryDate) {
      nextErrors.CouponExpiryDate = "Expiry date is required.";
    } else if (
      formData.CouponStartDate &&
      formData.CouponExpiryDate < formData.CouponStartDate
    ) {
      nextErrors.CouponExpiryDate = "Expiry date must be on or after the start date.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      CouponName: name,
      CouponCode: code,
      CouponType: formData.CouponType,
      CouponValue: value,
      CouponMinAmount: minAmount,
      CouponStartDate: formData.CouponStartDate,
      CouponExpiryDate: formData.CouponExpiryDate,
      ActiveStatus: formData.ActiveStatus ? 1 : 0,
      UpdatedBy: checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
      ...(CouponID ? { CouponID: Number(CouponID) } : {}),
    };

    try {
      const response = await saveCoupon(payload).unwrap();
      toast.success(response.message || "Coupon saved.");
      router.push("/legacy-of-marwar-admin/manage-coupon");
    } catch (error) {
      toast.error(error?.data?.message || "Could not save coupon.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>{CouponID ? "Update Coupon" : "Add Coupon"}</h1>
            <p>Set a discount, minimum order amount, validity dates, and status.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-coupon">
            Back to Coupons
          </Link>
        </div>
        {couponLoadError && (
          <p className={styles.loadError}>Unable to load this coupon. It may have been deleted.</p>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="couponName">Coupon Name*</label>
            <input
              id="couponName"
              value={formData.CouponName}
              onChange={(event) => handleChange("CouponName", event.target.value)}
              maxLength={255}
              required
            />
            {errors.CouponName && <span className={styles.error}>{errors.CouponName}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="couponCode">Coupon Code*</label>
              <input
                id="couponCode"
                value={formData.CouponCode}
                onChange={(event) => handleChange("CouponCode", event.target.value)}
                maxLength={100}
                autoCapitalize="characters"
                required
              />
              {errors.CouponCode && <span className={styles.error}>{errors.CouponCode}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="couponType">Coupon Type*</label>
              <select
                id="couponType"
                value={formData.CouponType}
                onChange={(event) => handleChange("CouponType", event.target.value)}
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed Amount">Fixed Amount</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="couponValue">
                Discount Value* {formData.CouponType === "Percentage" ? "(%)" : "(amount)"}
              </label>
              <input
                id="couponValue"
                type="number"
                min="1"
                max={formData.CouponType === "Percentage" ? "100" : undefined}
                step="1"
                value={formData.CouponValue}
                onChange={(event) => handleChange("CouponValue", event.target.value)}
                required
              />
              {errors.CouponValue && <span className={styles.error}>{errors.CouponValue}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="couponMinAmount">Minimum Order Amount*</label>
              <input
                id="couponMinAmount"
                type="number"
                min="0"
                step="1"
                value={formData.CouponMinAmount}
                onChange={(event) => handleChange("CouponMinAmount", event.target.value)}
                required
              />
              {errors.CouponMinAmount && (
                <span className={styles.error}>{errors.CouponMinAmount}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="couponStartDate">Start Date*</label>
              <input
                id="couponStartDate"
                type="date"
                value={formData.CouponStartDate}
                onChange={(event) => handleChange("CouponStartDate", event.target.value)}
                required
              />
              {errors.CouponStartDate && (
                <span className={styles.error}>{errors.CouponStartDate}</span>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="couponExpiryDate">Expiry Date*</label>
              <input
                id="couponExpiryDate"
                type="date"
                min={formData.CouponStartDate || undefined}
                value={formData.CouponExpiryDate}
                onChange={(event) => handleChange("CouponExpiryDate", event.target.value)}
                required
              />
              {errors.CouponExpiryDate && (
                <span className={styles.error}>{errors.CouponExpiryDate}</span>
              )}
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
              {isLoading ? "Saving..." : CouponID ? "Update Coupon" : "Save Coupon"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
