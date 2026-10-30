"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import { useGetBlogByIdQuery, useSaveOrUpdateBlogMutation, useGetMaxDisplayOrderQuery,} from "@/store/backendSlice/blogAPISlice";
import { usePagePermission } from "../usePagePermission";
import { validateFields } from "@/utils/validateFields";
import styles from "./page.module.css";

const SunEditor = nextDynamic(() => import("suneditor-react"), { ssr: false });
export default function AddUpdBlogData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const BlogID = searchParams.get("ID");
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
      const requiredPermission = BlogID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (requiredPermission !== 1) {
        toast.error(
          `You do not have permission to ${BlogID ? "edit" : "add"} blog post`,
        );
        router.push("/legacy-of-marwar-admin/manage-blog");
      }
    }
  }, [checkData, pagePermission, BlogID, router]);
  const { data: blogData } = useGetBlogByIdQuery(BlogID, {skip: !BlogID, refetchOnMountOrArgChange: true, });
  const [saveOrUpdateBlog, { isLoading }] = useSaveOrUpdateBlogMutation();
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    BlogName: "",
    BlogNameURL: "",
    BlogImage: null,
    BlogBannerImage: null,
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
  useEffect(() => {
    if (blogData?.success) {
      const data = blogData.data;
      setFormData({
        BlogName: data.BlogName || "",
        BlogNameURL: data.BlogNameURL || "",
        BlogImage: null,
        BlogBannerImage: null,
        Description: data.Description || "",
        MetaTitle: data.MetaTitle || "",
        MetaKeywords: data.MetaKeywords || "",
        MetaDescriptions: data.MetaDescriptions || "",
        MetaSchema: data.MetaSchema || "",
        ActiveStatus: data.ActiveStatus === 1,
        DisplayOrder: data.DisplayOrder ?? 0,
      });
      setPreviewImage(data.BlogImage ? `/OnlineImages/BlogImages/${data.BlogImage}` : "",);
      setPreviewBanner(data.BlogBannerImage? `/OnlineImages/BlogImages/${data.BlogBannerImage}`: "",);
    }
    else if (!BlogID && maxOrderData?.maxOrder !== undefined) {
      setFormData((prev) => ({
        ...prev,
        DisplayOrder: maxOrderData.maxOrder + 1,
      }));
    }
  }, [blogData, maxOrderData, BlogID]);
  const handleInput = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  const handleFileRename = (file, nameSuffix) => {
    const ext = file.name.split(".").pop();
    const slug = formData.BlogNameURL?.replace(/\s+/g, "-") || "blog";
    return new File([file], `${slug}${nameSuffix}.${ext}`, { type: file.type });
  };

  const validationRules = {
    BlogName: {
      required: true,
      requiredMessage: "Please enter a title.",
    },
    BlogNameURL: {
      required: true,
      requiredMessage: "Please enter a URL.",
    },
    BlogImage: {
      required: !BlogID,
      requiredMessage: "Please upload an image.",
    },
  };

  const handleSubmit = async () => {
    const requiredPermission = BlogID ? pagePermission.CanWrite : pagePermission.CanAdd;
    if (requiredPermission !== 1) {
      toast.error(
        `You do not have permission to ${BlogID ? "edit" : "add"} blog post`,
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
      if (key === "BlogImage" && value instanceof File) {
        data.append("BlogImage", handleFileRename(value, ""));
      } else if (key === "BlogBannerImage" && value instanceof File) {
        data.append("BlogBannerImage", handleFileRename(value, "-banner"));
      } else if (key === "ActiveStatus") {
        data.append(key, value ? "1" : "0");
      } else if (typeof value === "string" || typeof value === "number") {
        data.append(key, value.toString());
      }
    });
    data.append("UpdatedBy", "Admin Panel");
    if (BlogID) {
      data.append("BlogID", BlogID);
    }
    try {
      const res = await saveOrUpdateBlog(data).unwrap();
      if (res.success) {
        toast.success(res.message);
        router.push("/legacy-of-marwar-admin/manage-blog");
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
            <h1>{BlogID ? "Update blog" : "Create a blog"}</h1>
            <p className={styles.subtitle}>Add your article details, images, and search metadata.</p>
          </div>
          <Link href="/legacy-of-marwar-admin/manage-blog" className={styles.headerBack}>Back to blogs</Link>
        </div>
        <div className="form-group-row">
          <div className="form-group">
            <label>Blog Title*</label>
            <input
              type="text"
              placeholder="e.g. Industry Innovations 2024"
              value={formData.BlogName ?? ""}
              onChange={(e) => {
                const val = e.target.value;

                handleInput("BlogName", val);

                if (!BlogID) {
                  handleInput("BlogNameURL", generateSlug(val));

                  handleInput("MetaTitle", `${val} | Legacy Of Marwar`);
                }

                setFormErrors((prev) => ({
                  ...prev,
                  BlogName: "",
                }));
              }}
            />

            {formErrors.BlogName && (
              <p className="error">{formErrors.BlogName}</p>
            )}
          </div>

          <div className="form-group">
            <label>Blog URL*</label>

            <input
              type="text"
              placeholder="e.g. industry-innovations-2024"
              value={formData.BlogNameURL ?? ""}
              onChange={(e) => handleInput("BlogNameURL", e.target.value)}
            />
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
                    handleInput("BlogImage", file);
                    setPreviewImage(URL.createObjectURL(file));

                    setFormErrors((prev) => ({
                      ...prev,
                      BlogImage: "",
                    }));
                  }
                }}
              />

              {previewImage && (
                <img src={previewImage} alt="Thumbnail preview" className={styles.imagePreview} />
              )}
              {formErrors.BlogImage && (
                <p className="error">{formErrors.BlogImage}</p>
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
                    handleInput("BlogBannerImage", file);

                    setPreviewBanner(URL.createObjectURL(file));
                  }
                }}
              />
              {previewBanner && (
                <img src={previewBanner} alt="Banner preview" className={styles.bannerPreview} />
              )}
            </div>
          </div>
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
          <div className="form-group displayorder" style={{ display: "none" }}>
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
              placeholder="e.g. The Complete Mining Process: From Planning to Production | Legacy Of Marwar"
              value={formData.MetaTitle ?? ""}
              onChange={(e) => handleInput("MetaTitle", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Keywords</label>
            <input
              type="text"
              placeholder="e.g. sThe Complete Mining Process: From Planning to Production"
              value={formData.MetaKeywords ?? ""}
              onChange={(e) => handleInput("MetaKeywords", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Descriptions</label>
            <input
              type="text"
              placeholder="e.g. DThe Complete Mining Process: From Planning to Production"
              value={formData.MetaDescriptions ?? ""}
              onChange={(e) => handleInput("MetaDescriptions", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Schema</label>
            <input
              type="text"
              placeholder='e.g. {"@context": "https://schema.org", "@type": "BlogPosting"}'
              value={formData.MetaSchema ?? ""}
              onChange={(e) => handleInput("MetaSchema", e.target.value)}
            />
          </div>
        </section>

        <div className={styles.formActions}>
          <Link href="/legacy-of-marwar-admin/manage-blog" className={styles.cancelButton}>
            Cancel
          </Link>
          <button className={`submit-btn ${styles.saveButton}`} onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : BlogID ? "Save changes" : "Publish blog"}
          </button>
        </div>
      </div>
    </main>
  );
}
