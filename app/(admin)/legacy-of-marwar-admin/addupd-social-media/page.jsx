"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetMediaByIdQuery,
  useGetMaxMediaDisplayOrderQuery,
  useSaveMediaMutation,
} from "../../../../store/backendSlice/mediaAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const acceptedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

export default function AddUpdateMediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const MediaID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: mediaResponse, isError: mediaLoadError } = useGetMediaByIdQuery(MediaID, {
    skip: !MediaID,
    refetchOnMountOrArgChange: true,
  });
  const { data: maxOrderResponse } = useGetMaxMediaDisplayOrderQuery(undefined, {
    skip: Boolean(MediaID),
  });
  const [saveMedia, { isLoading }] = useSaveMediaMutation();
  const [formData, setFormData] = useState({
    MediaName: "",
    MediaURL: "",
    MediaImage: null,
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
      const canEdit = MediaID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (canEdit !== 1) {
        toast.error(`You do not have permission to ${MediaID ? "edit" : "add"} medias.`);
        router.push("/legacy-of-marwar-admin/manage-social-media");
      }
    }
  }, [checkData, pagePermission, MediaID, router]);

  useEffect(() => {
    if (mediaResponse?.success) {
      const media = mediaResponse.data;
      setFormData({
        MediaName: media.MediaName || "",
        MediaURL: media.MediaURL || "",
        MediaImage: null,
        DisplayOrder: media.DisplayOrder ?? 0,
        ActiveStatus: Number(media.ActiveStatus) === 1,
      });
      setPreview(media.MediaImage ? `/OnlineImages/MediaImages/${encodeURIComponent(media.MediaImage)}` : "");
    }
  }, [mediaResponse]);

  useEffect(() => {
    if (!MediaID && Number.isFinite(Number(maxOrderResponse?.maxOrder))) {
      setFormData((previous) => ({
        ...previous,
        DisplayOrder: Number(maxOrderResponse.maxOrder) + 1,
      }));
    }
  }, [MediaID, maxOrderResponse]);

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
      handleChange("MediaImage", null);
      setPreview("");
      return;
    }
    if (!acceptedVideoTypes.includes(file.type)) {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setFormData((previous) => ({ ...previous, MediaImage: null }));
      setPreview("");
      setErrors((previous) => ({ ...previous, MediaImage: "Choose an MP4, WebM, or Ogg video." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setFormData((previous) => ({ ...previous, MediaImage: null }));
      setPreview("");
      setErrors((previous) => ({ ...previous, MediaImage: "Video must be 10 MB or smaller." }));
      return;
    }
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormData((previous) => ({ ...previous, MediaImage: file }));
    setPreview(URL.createObjectURL(file));
    setErrors((previous) => ({ ...previous, MediaImage: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.MediaName.trim()) nextErrors.MediaName = "Please enter a media name.";
    // try {
    //   if (!formData.MediaURL.trim()) throw new Error();
    //   const parsedUrl = new URL(formData.MediaURL);
    //   if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
    // } catch {
    //   nextErrors.MediaURL = "Enter a valid http or https URL.";
    // }
    if (!MediaID && !formData.MediaImage) nextErrors.MediaImage = "Please upload an media video.";
    if (errors.MediaImage) nextErrors.MediaImage = errors.MediaImage;
    if (!Number.isInteger(Number(formData.DisplayOrder)) || Number(formData.DisplayOrder) < 0) {
      nextErrors.DisplayOrder = "Display order must be zero or greater.";
    }
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    payload.append("MediaName", formData.MediaName.trim());
    payload.append("MediaURL", formData.MediaURL.trim());
    payload.append("DisplayOrder", String(formData.DisplayOrder));
    payload.append("ActiveStatus", formData.ActiveStatus ? "1" : "0");
    payload.append("UpdatedBy", checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel");
    if (formData.MediaImage) payload.append("MediaImage", formData.MediaImage);
    if (MediaID) payload.append("MediaID", MediaID);

    try {
      const response = await saveMedia(payload).unwrap();
      if (!response.success) {
        toast.error(response.message || "Could not save media.");
        return;
      }
      toast.success(response.message);
      router.push("/legacy-of-marwar-admin/manage-social-media");
    } catch (error) {
      toast.error(error?.data?.message || "Could not save media.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1>{MediaID ? "Update Social Media" : "Add Social Media"}</h1>
            <p>Social media video, link, display order, and status.</p>
          </div>
          <Link className={styles.backButton} href="/legacy-of-marwar-admin/manage-social-media">Back to Social Media</Link>
        </div>
        {mediaLoadError && <p className={styles.loadError}>Unable to load this social media item. It may have been deleted.</p>}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="mediaName">Media Name*</label>
            <input id="mediaName" value={formData.MediaName} onChange={(event) => handleChange("MediaName", event.target.value)} maxLength={255} />
            {errors.MediaName && <span className={styles.error}>{errors.MediaName}</span>}
          </div>

          <div className={styles.field} style={{ display: "none" }}>
            <label htmlFor="mediaUrl">Media URL*</label>
            <input id="mediaUrl" type="url" value={formData.MediaURL} onChange={(event) => handleChange("MediaURL", event.target.value)} maxLength={2048} placeholder="https://example.com" />
            {errors.MediaURL && <span className={styles.error}>{errors.MediaURL}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="mediaImage">Media Video{MediaID ? "" : "*"}</label>
            <input id="mediaImage" type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => handleVideo(event.target.files?.[0])} />
            <small>MP4, WebM, or Ogg video; maximum 10 MB.</small>
            {errors.MediaImage && <span className={styles.error}>{errors.MediaImage}</span>}
            {preview && <div className={styles.preview}><video src={preview} controls preload="metadata" aria-label="Media video preview" /></div>}
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
            <button className={styles.submitButton} type="submit" disabled={isLoading}>{isLoading ? "Saving..." : MediaID ? "Update Media" : "Save Media"}</button>
            <Link className={styles.cancelButton} href="/legacy-of-marwar-admin/manage-social-media">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
