"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import { useGetCategoryByIdQuery, useSaveOrUpdateCategoryMutation, useGetMaxDisplayOrderQuery,} from "@/store/backendSlice/categoryAPISlice";
import { usePagePermission } from "../usePagePermission";
import { validateFields } from "@/utils/validateFields";
import styles from "./page.module.css";

const SunEditor = nextDynamic(() => import("suneditor-react"), { ssr: false });
export default function AddUpdCategoryData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const CategoryID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {refetchOnMountOrArgChange: true, pollingInterval: 180000, skipPollingIfUnfocused: true, });
  const pagePermission = usePagePermission(checkData);
  const { data: maxOrderData } = useGetMaxDisplayOrderQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission?.PageID !== 0) {
      const requiredPermission = CategoryID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (requiredPermission !== 1) {
        toast.error(
          `You do not have permission to ${CategoryID ? "edit" : "add"} category post`,
        );
        router.push("/legacy-of-marwar-admin/manage-category");
      }
    }
  }, [checkData, pagePermission, CategoryID, router]);
  const { data: categoryData } = useGetCategoryByIdQuery(CategoryID, {skip: !CategoryID, refetchOnMountOrArgChange: true, });
  const [saveOrUpdateCategory, { isLoading }] = useSaveOrUpdateCategoryMutation();
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    CategoryName: "",
    CategoryNameURL: "",
    CategoryImage: null,
    CategoryBannerImage: null,
    CategoryVideo: null,
    SmallDescription: "",
    Description: "",
    MetaTitle: "",
    MetaKeywords: "",
    MetaDescriptions: "",
    MetaSchema: "",
    ActiveStatus: false,
    DisplayOrder: 0,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [previewBanner, setPreviewBanner] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");
  useEffect(() => {
    if (categoryData?.success) {
      const data = categoryData.data;
      setFormData({
        CategoryName: data.CategoryName || "",
        CategoryNameURL: data.CategoryNameURL || "",
        CategoryImage: null,
        CategoryBannerImage: null,
        CategoryVideo: null,
        SmallDescription: data.SmallDescription || "",
        Description: data.Description || "",
        MetaTitle: data.MetaTitle || "",
        MetaKeywords: data.MetaKeywords || "",
        MetaDescriptions: data.MetaDescriptions || "",
        MetaSchema: data.MetaSchema || "",
        ActiveStatus: data.ActiveStatus === 1,
        DisplayOrder: data.DisplayOrder ?? 0,
      });
      setPreviewImage(data.CategoryImage ? `/OnlineImages/CategoryImages/${data.CategoryImage}` : "",);
      setPreviewBanner(data.CategoryBannerImage? `/OnlineImages/CategoryImages/${data.CategoryBannerImage}`: "",);
      setPreviewVideo(data.CategoryVideo ? `/OnlineImages/CategoryImages/${data.CategoryVideo}` : "");
    }
    else if (!CategoryID && maxOrderData?.maxOrder !== undefined) {
      setFormData((prev) => ({
        ...prev,
        DisplayOrder: maxOrderData.maxOrder + 1,
      }));
    }
  }, [categoryData, maxOrderData, CategoryID]);
  const handleInput = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  const handleFileRename = (file, nameSuffix) => {
    const ext = file.name.split(".").pop();
    const slug = formData.CategoryNameURL?.replace(/\s+/g, "-") || "category";
    return new File([file], `${slug}${nameSuffix}.${ext}`, { type: file.type });
  };

  const validationRules = {
    CategoryName: {
      required: true,
      requiredMessage: "Please enter a title.",
    },
    CategoryNameURL: {
      required: true,
      requiredMessage: "Please enter a URL.",
    },
    SmallDescription: {
      required: true,
      requiredMessage: "Please enter a tagline.",
    },
    CategoryImage: {
      required: !CategoryID,
      requiredMessage: "Please upload an image.",
    },
    CategoryBannerImage: {
      required: !CategoryID,
      requiredMessage: "Please upload an banner.",
    },
    CategoryVideo: {
      required: !CategoryID,
      requiredMessage: "Please upload an video.",
    },
  };

  const handleSubmit = async () => {
    const requiredPermission = CategoryID ? pagePermission.CanWrite : pagePermission.CanAdd;
    if (requiredPermission !== 1) {
      toast.error(
        `You do not have permission to ${CategoryID ? "edit" : "add"} category post`,
      );
      return;
    }
    const errors = validateFields(formData, validationRules);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "CategoryImage" && value instanceof File) {
        data.append("CategoryImage", handleFileRename(value, ""));
      } else if (key === "CategoryBannerImage" && value instanceof File) {
        data.append("CategoryBannerImage", handleFileRename(value, "-banner"));
      } else if (key === "CategoryVideo" && value instanceof File) {
        data.append("CategoryVideo", handleFileRename(value, "-video"));
      } else if (key === "ActiveStatus") {
        data.append(key, value ? "1" : "0");
      } else if (typeof value === "string" || typeof value === "number") {
        data.append(key, value.toString());
      }
    });
    data.append("UpdatedBy", "Admin Panel");
    if (CategoryID) {
      data.append("CategoryID", CategoryID);
    }
    try {
      const res = await saveOrUpdateCategory(data).unwrap();
      if (res.success) {
        toast.success(res.message);
        router.push("/legacy-of-marwar-admin/manage-category");
      } else {
        toast.error(res.message || "Save failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong");
    }
  };
  const editorOptions = {
    buttonList: [
      ["undo", "redo"],
      ["font", "fontSize", "formatBlock"],
      ["bold", "underline", "italic", "strike", "subscript", "superscript"],
      ["removeFormat"],
      "/",
      [
        "fontColor",
        "hiliteColor",
        "outdent",
        "indent",
        "align",
        "horizontalRule",
        "list",
        "table",
      ],
      ["link", "image", "video"],
      ["fullScreen", "showBlocks", "codeView"],
      ["preview", "print"],
    ], minHeight: "200px",
  };
  return (
    <main className={`${styles.page} add_update container`}>
      <div className={`form-box ${styles.formCard}`}>
        <div className={styles.formHeader}>
          <div>
            <h1>{CategoryID ? "Update category" : "Create a category"}</h1>
            <p className={styles.subtitle}>Add your article details, images, and search metadata.</p>
          </div>
          <Link href="/legacy-of-marwar-admin/manage-category" className={styles.headerBack}>Back to categorys</Link>
        </div>
        <div className="form-group-row">
          <div className="form-group">
            <label>Category Title*</label>
            <input
              type="text"
              placeholder="e.g. Earrings"
              value={formData.CategoryName ?? ""}
              onChange={(e) => {
                const val = e.target.value;

                handleInput("CategoryName", val);

                if (!CategoryID) {
                  handleInput("CategoryNameURL", generateSlug(val));

                  handleInput("MetaTitle", `${val} | Legacy Of Marwar`);
                }

                setFormErrors((prev) => ({
                  ...prev,
                  CategoryName: "",
                }));
              }}
            />

            {formErrors.CategoryName && (
              <p className="error">{formErrors.CategoryName}</p>
            )}
          </div>

          <div className="form-group">
            <label>Category URL*</label>

            <input
              type="text"
              placeholder="e.g. earrings"
              value={formData.CategoryNameURL ?? ""}
              onChange={(e) => handleInput("CategoryNameURL", e.target.value)}
            />
            {formErrors.CategoryNameURL && (
              <p className="error">{formErrors.CategoryNameURL}</p>
            )}
          </div>
          <div className="form-group">
            <label>Tagline*</label>

            <input
              type="text"
              placeholder="e.g. Elegant silver earrings crafted to add a subtle sparkle to every look."
              value={formData.SmallDescription ?? ""}
             onChange={(e) => handleInput("SmallDescription", e.target.value)}
            />
            {formErrors.SmallDescription && (
              <p className="error">{formErrors.SmallDescription}</p>
            )}
          </div>
        </div>

        <div className={`form-group-row file-uploade-sec ${styles.uploadRow}`}>
          <div className={styles.uploadColumn}>
            <div className="form-group">
              <label>Thumbnail image*</label>
              <p className={styles.fieldHint}>Main image shown with your article.</p>

              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleInput("CategoryImage", file);
                    setPreviewImage(URL.createObjectURL(file));

                    setFormErrors((prev) => ({
                      ...prev,
                      CategoryImage: "",
                    }));
                  }
                }}
              />

              {previewImage && (
                <img src={previewImage} alt="Thumbnail preview" className={styles.imagePreview} />
              )}
              {formErrors.CategoryImage && (
                <p className="error">{formErrors.CategoryImage}</p>
              )}
            </div>
          </div>

          <div className={styles.uploadColumn}>
            <div className="form-group">
              <label>Banner image*</label>
              <p className={styles.fieldHint}>Wide image used at the top of the article.</p>
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleInput("CategoryBannerImage", file);

                    setPreviewBanner(URL.createObjectURL(file));
                  }
                }}
              />
              {previewBanner && (
                <img src={previewBanner} alt="Banner preview" className={styles.bannerPreview} />
              )}
              {formErrors.CategoryBannerImage && (
                <p className="error">{formErrors.CategoryBannerImage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Category Video*</label>
          <input
            type="file"
            accept="video/*"
            className={styles.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file) {
                handleInput("CategoryVideo", file);
                setPreviewVideo(URL.createObjectURL(file));
              }
            }}
          />
          <p className={styles.fieldHint}>Upload a video file. Leave blank to keep the current video.</p>
          {previewVideo && (
            <video
              src={previewVideo}
              controls
              preload="metadata"
              className={styles.bannerPreview}
            />
          )}
          {formErrors.CategoryVideo && (
            <p className="error">{formErrors.CategoryVideo}</p>
          )}
        </div>

        <div className={`form-group ${styles.descriptionGroup}`}>
          <label>
            Description
          </label>

          <div className={styles.editorFrame}>
            <SunEditor
              lang="en"
              name="Description"
              width="100%"
              height="200px"
              setContents={formData.Description || ""}
              onChange={(content) => handleInput("Description", content)}
              setOptions={editorOptions}
            />
          </div>
        </div>

        <div className={`form-group-row ${styles.orderStatusRow}`}>
          <div className="form-group displayorder" style={{ display: "block" }}>
            <label>Display Order</label>

            <input
              type="number"
              value={formData.DisplayOrder ?? ""}
              onChange={(e) =>
                handleInput(
                  "DisplayOrder",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>

          <div className="form-group-row statusac">
            <input
              type="checkbox"
              id="chkActiveStatus"
              checked={formData.ActiveStatus}
              onChange={(e) => handleInput("ActiveStatus", e.target.checked)}
            />

            <label htmlFor="chkActiveStatus">Status (Active/Inactive)</label>
          </div>
        </div>

        <section className={styles.seoSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>SEARCH VISIBILITY</p>
              <h2>SEO information</h2>
            </div>
            <span>Optional</span>
          </div>

          <div className="form-group">
            <label className="block-label">Meta Title</label>
            <input
              type="text"
              placeholder="e.g. Earrings | Legacy Of Marwar"
              value={formData.MetaTitle ?? ""}
              onChange={(e) => handleInput("MetaTitle", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Keywords</label>
            <input
              type="text"
              placeholder="e.g. Earrings"
              value={formData.MetaKeywords ?? ""}
              onChange={(e) => handleInput("MetaKeywords", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Descriptions</label>
            <input
              type="text"
              placeholder="e.g. Earrings"
              value={formData.MetaDescriptions ?? ""}
              onChange={(e) => handleInput("MetaDescriptions", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Schema</label>
            <input
              type="text"
              placeholder='e.g. {"@context": "https://schema.org", "@type": "CategoryPosting"}'
              value={formData.MetaSchema ?? ""}
              onChange={(e) => handleInput("MetaSchema", e.target.value)}
            />
          </div>
        </section>

        <div className={styles.formActions}>
          <Link href="/legacy-of-marwar-admin/manage-category" className={styles.cancelButton}>
            Cancel
          </Link>
          <button className={`submit-btn ${styles.saveButton}`} onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : CategoryID ? "Save changes" : "Publish category"}
          </button>
        </div>
      </div>
    </main>
  );
}
