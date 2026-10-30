"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetOccasionByIdQuery,
  useGetMaxOccasionDisplayOrderQuery,
  useSaveOccasionMutation,
} from "../../../../store/backendSlice/occasionAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const acceptedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

export default function AddUpdateOccasionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const OccasionID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: occasionResponse, isError: occasionLoadError } = useGetOccasionByIdQuery(OccasionID, {
    skip: !OccasionID,
    refetchOnMountOrArgChange: true,
  });
  const { data: maxOrderResponse } = useGetMaxOccasionDisplayOrderQuery(undefined, {
    skip: Boolean(OccasionID),
  });
  const [saveOccasion, { isLoading }] = useSaveOccasionMutation();
  const [formData, setFormData] = useState({
    OccasionName: "",
    OccasionURL: "",
    OccasionImage: null,
    DisplayOrder: 0,
    ActiveStatus: true,
  });
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.PageID !== 0) {
      const canEdit = OccasionID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (canEdit !== 1) {
        toast.error(`You do not have permission to ${OccasionID ? "edit" : "add"} occasions.`);
        router.push("/legacy-of-marwar-admin/manage-occasion");
      }
    }
  }, [checkData, pagePermission, OccasionID, router]);

  useEffect(() => {
    if (occasionResponse?.success) {
      const occasion = occasionResponse.data;
      setFormData({
        OccasionName: occasion.OccasionName || "",
        OccasionURL: occasion.OccasionURL || "",
        OccasionImage: null,
        DisplayOrder: occasion.DisplayOrder ?? 0,
        ActiveStatus: Number(occasion.ActiveStatus) === 1,
      });
      setPreview(occasion.OccasionImage ? `/OnlineImages/OccasionImages/${encodeURIComponent(occasion.OccasionImage)}` : "");
    }
  }, [occasionResponse]);

  useEffect(() => {
    if (!OccasionID && Number.isFinite(Number(maxOrderResponse?.maxOrder))) {
      setFormData((previous) => ({
        ...previous,
        DisplayOrder: Number(maxOrderResponse.maxOrder) + 1,
      }));
    }
  }, [OccasionID, maxOrderResponse]);

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleVideo = (file) => {
    if (!file) {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      handleChange("OccasionImage", null);
      setPreview("");
      return;
    }
    if (!acceptedVideoTypes.includes(file.type)) {
      setFormData((previous) => ({ ...previous, OccasionImage: null }));
      setErrors((previous) => ({ ...previous, OccasionImage: "Choose an MP4, WebM, or Ogg video." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormData((previous) => ({ ...previous, OccasionImage: null }));
      setErrors((previous) => ({ ...previous, OccasionImage: "Video must be 10 MB or smaller." }));
      return;
    }
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormData((previous) => ({ ...previous, OccasionImage: file }));
    setPreview(URL.createObjectURL(file));
    setErrors((previous) => ({ ...previous, OccasionImage: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.OccasionName.trim()) nextErrors.OccasionName = "Please enter a occasion name.";
    // try {
    //   if (!formData.OccasionURL.trim()) throw new Error();
    //   const parsedUrl = new URL(formData.OccasionURL);
    //   if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
    // } catch {
    //   nextErrors.OccasionURL = "Enter a valid http or https URL.";
    // }
    if (!OccasionID && !formData.OccasionImage) nextErrors.OccasionImage = "Please upload an occasion video.";
    if (errors.OccasionImage) nextErrors.OccasionImage = errors.OccasionImage;
    if (!Number.isInteger(Number(formData.DisplayOrder)) || Number(formData.DisplayOrder) < 0) {
      nextErrors.DisplayOrder = "Display order must be zero or greater.";
    }
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    payload.append("OccasionName", formData.OccasionName.trim());
    payload.append("OccasionURL", formData.OccasionURL.trim());
    payload.append("DisplayOrder", String(formData.DisplayOrder));
    payload.append("ActiveStatus", formData.ActiveStatus ? "1" : "0");
    payload.append("UpdatedBy", checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel");
    if (formData.OccasionImage) payload.append("OccasionImage", formData.OccasionImage);
    if (OccasionID) payload.append("OccasionID", OccasionID);

    try {
      const response = await saveOccasion(payload).unwrap();
      if (!response.success) {
        toast.error(response.message || "Could not save occasion.");
        return;
      }
      toast.success(response.message);
      router.push("/legacy-of-marwar-admin/manage-occasion");
    } catch (error) {
      toast.error(error?.data?.message || "Could not save occasion.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>{OccasionID ? "Update Occasion" : "Add Occasion"}</h1>
            <p>Occasion video, link, display order, and status.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-occasion">Back to Occasions</Link>
        </div>
        {occasionLoadError && <p className={styles.loadError}>Unable to load this occasion. It may have been deleted.</p>}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="occasionName">Occasion Name*</label>
            <input id="occasionName" value={formData.OccasionName} onChange={(event) => handleChange("OccasionName", event.target.value)} maxLength={255} />
            {errors.OccasionName && <span className={styles.error}>{errors.OccasionName}</span>}
          </div>

          <div className={styles.field} style={{ display: "none" }}>
            <label htmlFor="occasionUrl">Occasion URL*</label>
            <input id="occasionUrl" type="url" value={formData.OccasionURL} onChange={(event) => handleChange("OccasionURL", event.target.value)} maxLength={2048} placeholder="https://example.com" />
            {errors.OccasionURL && <span className={styles.error}>{errors.OccasionURL}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="occasionImage">Occasion Video{OccasionID ? "" : "*"}</label>
            <input id="occasionImage" type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => handleVideo(event.target.files?.[0])} />
            <small>MP4, WebM, or Ogg video; maximum 10 MB.</small>
            {errors.OccasionImage && <span className={styles.error}>{errors.OccasionImage}</span>}
            {preview && <div className={styles.preview}><video src={preview} controls preload="metadata" aria-label="Occasion video preview" /></div>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="displayOrder">Display Order*</label>
              <input id="displayOrder" type="number" min="0" step="1" value={formData.DisplayOrder} onChange={(event) => handleChange("DisplayOrder", event.target.value)} />
              {errors.DisplayOrder && <span className={styles.error}>{errors.DisplayOrder}</span>}
            </div>
            <label className={styles.status} htmlFor="activeStatus">
              <input id="activeStatus" type="checkbox" checked={formData.ActiveStatus} onChange={(event) => handleChange("ActiveStatus", event.target.checked)} />
              Active
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.submitButton} type="submit" disabled={isLoading}>{isLoading ? "Saving..." : OccasionID ? "Update Occasion" : "Save Occasion"}</button>
            <Link className={styles.cancelButton} href="/legacy-of-marwar-admin/manage-occasion">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
