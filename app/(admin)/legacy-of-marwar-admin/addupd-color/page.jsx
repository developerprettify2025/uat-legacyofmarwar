"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetColorByIdQuery,
  useSaveColorMutation,
} from "../../../../store/backendSlice/colorAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const isHexColor = (value) => /^#[\da-f]{6}$/i.test(value);

export default function AddUpdateColorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ColorID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: colorResponse, isError: colorLoadError } = useGetColorByIdQuery(ColorID, {
    skip: !ColorID,
    refetchOnMountOrArgChange: true,
  });
  const [saveColor, { isLoading }] = useSaveColorMutation();
  const [formData, setFormData] = useState({
    ColorName: "",
    ColorCode: "#000000",
    DisplayOrder: 0,
    ActiveStatus: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.PageID !== 0) {
      const canEdit = ColorID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (canEdit !== 1) {
        toast.error(`You do not have permission to ${ColorID ? "edit" : "add"} colors.`);
        router.push("/legacy-of-marwar-admin/manage-color");
      }
    }
  }, [checkData, pagePermission, ColorID, router]);

  useEffect(() => {
    if (colorResponse?.success) {
      const color = colorResponse.data;
      setFormData({
        ColorName: color.ColorName || "",
        ColorCode: color.ColorCode || "#000000",
        DisplayOrder: color.DisplayOrder ?? "",
        ActiveStatus: Number(color.ActiveStatus) === 1,
      });
    }
  }, [colorResponse]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.ColorName.trim()) nextErrors.ColorName = "Please enter a color name.";
    if (!formData.ColorCode.trim()) nextErrors.ColorCode = "Please enter a color code.";
    if (formData.DisplayOrder !== "" &&
      (!Number.isInteger(Number(formData.DisplayOrder)) || Number(formData.DisplayOrder) < 0)) {
      nextErrors.DisplayOrder = "Display order must be zero or greater.";
    }
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      ColorName: formData.ColorName.trim(),
      ColorCode: formData.ColorCode.trim(),
      DisplayOrder: formData.DisplayOrder === "" ? null : Number(formData.DisplayOrder),
      ActiveStatus: formData.ActiveStatus ? 1 : 0,
      UpdatedBy: checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
      ...(ColorID ? { ColorID: Number(ColorID) } : {}),
    };

    try {
      const response = await saveColor(payload).unwrap();
      if (!response.success) {
        toast.error(response.message || "Could not save color.");
        return;
      }
      toast.success(response.message);
      router.push("/legacy-of-marwar-admin/manage-color");
    } catch (error) {
      toast.error(error?.data?.message || "Could not save color.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>{ColorID ? "Update Color" : "Add Color"}</h1>
            <p>Color name, code, display order, and status.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-color">Back to Colors</Link>
        </div>
        {colorLoadError && <p className={styles.loadError}>Unable to load this color. It may have been deleted.</p>}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="colorName">Color Name*</label>
            <input id="colorName" value={formData.ColorName} onChange={(event) => handleChange("ColorName", event.target.value)} maxLength={255} />
            {errors.ColorName && <span className={styles.error}>{errors.ColorName}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="colorCode">Color Code*</label>
            <div className={styles.colorCodeRow}>
              <input id="colorCode" value={formData.ColorCode} onChange={(event) => handleChange("ColorCode", event.target.value)} maxLength={255} placeholder="#000000" />
              <input
                aria-label="Pick color"
                type="color"
                value={isHexColor(formData.ColorCode) ? formData.ColorCode : "#000000"}
                onChange={(event) => handleChange("ColorCode", event.target.value)}
              />
            </div>
            {errors.ColorCode && <span className={styles.error}>{errors.ColorCode}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="displayOrder">Display Order</label>
              <input id="displayOrder" type="number" min="0" step="1" value={formData.DisplayOrder} onChange={(event) => handleChange("DisplayOrder", event.target.value)} />
              {errors.DisplayOrder && <span className={styles.error}>{errors.DisplayOrder}</span>}
            </div>
            <label className={styles.status}>
              <input type="checkbox" checked={formData.ActiveStatus} onChange={(event) => handleChange("ActiveStatus", event.target.checked)} />
              Active
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.submitButton} type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : ColorID ? "Update Color" : "Save Color"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
