'use client';

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useGetStaticByIdQuery, useSaveOrUpdateStaticMutation, } from "@/store/backendSlice/staticAPISlice";
import { useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import { usePagePermission } from "../usePagePermission";
import { validateFields } from "@/utils/validateFields";
import styles from "../addupd-blog/page.module.css";

export default function AddUpdStaticData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const StaticID = searchParams.get("ID");
  const [formErrors, setFormErrors] = useState({});

  const { data: checkData, isSuccess: isAuthSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 180000,
    skipPollingIfUnfocused: true,
  });
  const pagePermission = usePagePermission(checkData);
  const isPermissionsReady = checkData?.loggedIn && pagePermission?.PageID !== 0;

  const { data: staticResponse } = useGetStaticByIdQuery(StaticID, { skip: !StaticID, refetchOnMountOrArgChange: true, });
  const [saveOrUpdateStatic, { isLoading: isSaving }] = useSaveOrUpdateStaticMutation();

  useEffect(() => {
    if (isAuthSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isAuthSuccess, checkData, router]);

  useEffect(() => {
    if (isPermissionsReady) {
      const requiredPermission = StaticID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (requiredPermission !== 1) {
        toast.error(`You do not have permission to ${StaticID ? 'edit' : 'add'} page`);
        router.push("/legacy-of-marwar-admin/manage-page");
      }
    }
  }, [isPermissionsReady, pagePermission, StaticID, router]);

  const [previewImage, setPreviewImage] = useState("");
  const [previewBanner, setPreviewBanner] = useState("");

  const [formData, setFormData] = useState({
    StaticName: "",
    StaticNameURL: "",
    StaticImage: null,
    StaticBannerVideo: null,
    SmallDescription: "",
    Description: "",
    ActiveStatus: true,
    StaticAddress: "",
    StaticAddress2: "",
    StaticPhoneNumber: "",
    StaticPhoneNumber2: "",
    StaticEmail: "",
    StaticTwitterLink: "",
    StaticFacebookLink: "",
    StaticInstagramLink: "",
    StaticLinkedInLink: "",
    StaticYouTubeLink: "",
    StaticWhatsAppLink: "",
    StaticPinterestLink: "",
    MetaTitle: "",
    MetaKeywords: "",
    MetaDescriptions: "",
    MetaSchema: "",
  });

  useEffect(() => {
    if (isAuthSuccess && staticResponse?.success) {
      const data = staticResponse.data;
      setFormData({
        StaticName: data.StaticName || "",
        StaticNameURL: data.StaticNameURL || "",
        SmallDescription: data.SmallDescription || "",
        Description: data.Description || "",
        ActiveStatus: data.ActiveStatus === 1,
        StaticAddress: data.StaticAddress || "",
        StaticAddress2: data.StaticAddress2 || "",
        StaticEmail: data.StaticEmail || "",
        StaticPhoneNumber: data.StaticPhoneNumber || "",
        StaticPhoneNumber2: data.StaticPhoneNumber2 || "",
        StaticTwitterLink: data.StaticTwitterLink || "",
        StaticFacebookLink: data.StaticFacebookLink || "",
        StaticInstagramLink: data.StaticInstagramLink || "",
        StaticLinkedInLink: data.StaticLinkedInLink || "",
        StaticYouTubeLink: data.StaticYouTubeLink || "",
        StaticWhatsAppLink: data.StaticWhatsAppLink || "",
        StaticPinterestLink: data.StaticPinterestLink || "",
        MetaTitle: data.MetaTitle || "",
        MetaKeywords: data.MetaKeywords || "",
        MetaDescriptions: data.MetaDescriptions || "",
        MetaSchema: data.MetaSchema || "",
        StaticImage: null,
        StaticBannerVideo: null,
      });
      if (data.StaticImage) setPreviewImage(`/OnlineImages/PageImages/${data.StaticImage}`);
      if (data.StaticBannerVideo) setPreviewBanner(data.StaticBannerVideo);
    }
  }, [isAuthSuccess, staticResponse]);

  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (text) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  const handleFileRename = (file, nameSuffix) => {
    const ext = file.name.split(".").pop();
    const slug = formData.StaticNameURL?.replace(/\s+/g, "-") || "static";
    const newName = `${slug}${nameSuffix}.${ext}`;
    return new File([file], newName, { type: file.type });
  };

  const validationRules = {
    StaticName: { required: true, requiredMessage: "Please enter static title." },
  };

  const handleSubmit = async () => {
    const requiredPermission = StaticID ? pagePermission.CanWrite : pagePermission.CanAdd;
    if (requiredPermission !== 1) {
      toast.error(`You do not have permission to ${StaticID ? 'edit' : 'add'} page`);
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
      if (key === "StaticImage" && value instanceof File) {
        data.append("StaticImage", handleFileRename(value, ""));
      } else if (key === "StaticBannerVideo" && value instanceof File) {
        data.append("StaticBannerVideo", handleFileRename(value, "-banner"));
      } else if (key === "ActiveStatus") {
        data.append("ActiveStatus", value ? "1" : "0");
      } else if (typeof value === "string" || typeof value === "number") {
        data.append(key, value.toString());
      }
    });
    data.append("UpdatedBy", "Admin Panel");
    data.append("type", "static");
    if (StaticID) data.append("StaticID", StaticID);
    try {
      const result = await saveOrUpdateStatic(data).unwrap();
      if (result.success) {
        toast.success(result.message);
        router.push("/legacy-of-marwar-admin/manage-page");
      } else {
        toast.error(result.message || "Save failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <main className={`${styles.page} add_update container`}>
      <div className={`form-box ${styles.formCard}`}>
        <div className={styles.formHeader}>
          <div>
            <p className={styles.eyebrow}>CONTENT MANAGEMENT</p>
            <h1>{StaticID ? "Update page" : "Create a page"}</h1>
            <p className={styles.subtitle}>Edit page details, contact information, and search metadata.</p>
          </div>
          <Link href="/legacy-of-marwar-admin/manage-page" className={styles.headerBack}>
            Back to pages
          </Link>
        </div>

        <div className="form-group-row">
          <div className="form-group displayorder" style={{ width: "100%" }}>
            <label>Page Title*</label>
            <input
              type="text"
              name="StaticName"
              placeholder="e.g. About Us"
              value={formData.StaticName ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                handleInput("StaticName", val);
                if (!StaticID) {
                  handleInput("StaticNameURL", generateSlug(val));
                  handleInput("MetaTitle", `${val} | Legacy Of Marwar `);
                }
                setFormErrors(prev => ({ ...prev, StaticName: "" }));
              }}
            />
            {formErrors.StaticName && <p className="error">{formErrors.StaticName}</p>}
          </div>
        </div>

        {Number(StaticID) === 6 && (
          <>
            <div className="form-group-row">
              <div className="form-group" style={{ display: "none" }}>
                <label>Page URL Slug*</label>
                <input
                  type="text"
                  placeholder="about-us"
                  value={formData.StaticNameURL ?? ""}
                  onChange={(e) => handleInput("StaticNameURL", e.target.value)}
                />
              </div>
              {/* <div className="form-group">
                <label>Small Description</label>
                <input
                  type="text"
                  placeholder="Short description here..."
                  value={formData.SmallDescription ?? ""}
                  onChange={(e) => handleInput("SmallDescription", e.target.value)}
                />
              </div> */}
            </div>

            {/* <div className="form-group" style={{ display: "block", width: "100%" }}>
              <label >Full Description</label>
              <div style={{ width: "100%", backgroundColor: "#fff" }}>
                <SunEditor
                  lang="en"
                  name="Description"
                  width="100%"
                  height="200px"
                  setContents={formData.Description || ""}
                  onChange={(content) => handleInput("Description", content)}
                  setOptions={{
                    buttonList: [
                      ['undo', 'redo'],
                      ['font', 'fontSize', 'formatBlock'],
                      ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                      ['removeFormat'],
                      '/',
                      ['fontColor', 'hiliteColor', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'table'],
                      ['link', 'image', 'video'],
                      ['fullScreen', 'showBlocks', 'codeView'],
                      ['preview', 'print']
                    ],
                    minHeight: "200px"
                  }}
                />
              </div>
            </div> */}

            {/* <div className="form-group-row file-uploade-sec">
              <div className="colA">
                <div className="form-group">
                  <label>Page Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInput("StaticImage", file);
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <span className="hint-text">(Upload appropriate image file)</span>
                </div>
                {previewImage && (
                  <div className="file-image-sec">
                    <img src={previewImage} alt="Static" width={150} />
                  </div>
                )}
              </div>
              <div className="colB">
                <div className="form-group">
                  <label>Banner Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInput("StaticBannerVideo", file);
                        setPreviewBanner(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <span className="hint-text">(Upload MP4 format)</span>
                </div>
                {previewBanner && (
                  <div className="file-image-sec">
                    {formData.StaticBannerVideo instanceof File ? (
                      <video src={previewBanner} width="90" height="80" autoPlay muted loop controls />
                    ) : (
                      <video src={`/OnlineImages/PageImages/${previewBanner}`} width="90" height="80" autoPlay muted loop controls />
                    )}
                  </div>
                )}
              </div>
            </div> */}
          </>
        )}

        <div className="form-group-row statusac mt-3 mb-4" style={{ display: "none"}}>
          <input type="checkbox" id="chkActiveStatus" checked={formData.ActiveStatus} onChange={(e) => handleInput("ActiveStatus", e.target.checked)} />
          <label htmlFor="chkActiveStatus">Status (Active/Inactive)</label>
        </div>

        {Number(StaticID) === 4 && (
          <>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>PAGE DETAILS</p>
                <h2>Contact information</h2>
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label>Address 1</label>
                <input type="text" placeholder="e.g. 123 Healthcare Blvd, Medical Hub, City" value={formData.StaticAddress ?? ""} onChange={(e) => handleInput("StaticAddress", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="e.g. contact@Legacy Of Marwar.com" value={formData.StaticEmail ?? ""} onChange={(e) => handleInput("StaticEmail", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone Number 1</label>
                <input type="text" placeholder="e.g. +91 9876543210" value={formData.StaticPhoneNumber ?? ""} onChange={(e) => handleInput("StaticPhoneNumber", e.target.value)} />
              </div>
            </div>

            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>SOCIAL PROFILES</p>
                <h2>Social media links</h2>
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label>X</label>
                <input type="text" placeholder="e.g. https://linkedin.com/company/Legacy Of Marwar" value={formData.StaticTwitterLink ?? ""} onChange={(e) => handleInput("StaticTwitterLink", e.target.value)} />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input type="text" placeholder="e.g. https://linkedin.com/company/Legacy Of Marwar" value={formData.StaticLinkedInLink ?? ""} onChange={(e) => handleInput("StaticLinkedInLink", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input type="text" placeholder="e.g. https://instagram.com/Legacy Of Marwarspinecare" value={formData.StaticInstagramLink ?? ""} onChange={(e) => handleInput("StaticInstagramLink", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Facebook</label>
                <input type="text" placeholder="e.g. https://facebook.com/Legacy Of Marwarspinecare" value={formData.StaticFacebookLink ?? ""} onChange={(e) => handleInput("StaticFacebookLink", e.target.value)} />
              </div>
            </div>
          </>
        )}

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
          <input type="text" placeholder="e.g. About Legacy Of Marwar | Spine & Joint Care Clinic" value={formData.MetaTitle ?? ""} onChange={(e) => handleInput("MetaTitle", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="block-label">Meta Keywords</label>
          <input type="text" placeholder="e.g. spine clinic, joint care, non-surgical spine treatment" value={formData.MetaKeywords ?? ""} onChange={(e) => handleInput("MetaKeywords", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="block-label">Meta Descriptions</label>
          <input type="text" placeholder="e.g. Legacy Of Marwar provides cutting-edge non-surgical spine and joint care." value={formData.MetaDescriptions ?? ""} onChange={(e) => handleInput("MetaDescriptions", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="block-label">Meta Schema</label>
          <input type="text" placeholder='e.g. {"@context": "https://schema.org", "@type": "MedicalClinic"}' value={formData.MetaSchema ?? ""} onChange={(e) => handleInput("MetaSchema", e.target.value)} />
        </div>
        </section>

        <div className={styles.formActions}>
          <Link href="/legacy-of-marwar-admin/manage-page" className={styles.cancelButton}>
            Cancel
          </Link>
          <button className={`submit-btn ${styles.saveButton}`} onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : StaticID ? "Save changes" : "Save page"}
          </button>
        </div>
      </div>
    </main>
  );
}