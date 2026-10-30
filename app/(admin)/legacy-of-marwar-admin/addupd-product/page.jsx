"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import { useGetAllCategorysQuery } from "@/store/backendSlice/categoryAPISlice";
import { useGetAllOccasionsQuery } from "@/store/backendSlice/occasionAPISlice";
import { useGetAllColorsQuery } from "@/store/backendSlice/colorAPISlice";
import { useGetProductByIdQuery, useSaveOrUpdateProductMutation, useGetMaxDisplayOrderQuery, } from "@/store/backendSlice/productAPISlice";
import { usePagePermission } from "../usePagePermission";
import { validateFields } from "@/utils/validateFields";
import styles from "./page.module.css";

const SunEditor = nextDynamic(() => import("suneditor-react"), { ssr: false });
export default function AddUpdProductData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ProductID = searchParams.get("ID");
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, { refetchOnMountOrArgChange: true, pollingInterval: 180000, skipPollingIfUnfocused: true, });
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
      const requiredPermission = ProductID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (requiredPermission !== 1) {
        toast.error(
          `You do not have permission to ${ProductID ? "edit" : "add"} product post`,
        );
        router.push("/legacy-of-marwar-admin/manage-product");
      }
    }
  }, [checkData, pagePermission, ProductID, router]);
  const { data: productData } = useGetProductByIdQuery(ProductID, { skip: !ProductID, refetchOnMountOrArgChange: true, });
  const [saveOrUpdateProduct, { isLoading }] = useSaveOrUpdateProductMutation();
  const [formErrors, setFormErrors] = useState({});
  const {
    data: categories = [],
    isLoading: areCategoriesLoading,
    isError: categoryLoadError,
  } = useGetAllCategorysQuery();
  const {
    data: occasionResponse,
    isLoading: areOccasionsLoading,
    isError: occasionLoadError,
  } = useGetAllOccasionsQuery();
  const occasions = occasionResponse?.data || [];
  const {
    data: colorResponse,
    isLoading: areColorsLoading,
    isError: colorLoadError,
  } = useGetAllColorsQuery();
  const colors = colorResponse?.data || [];
  const [formData, setFormData] = useState({
    ProductName: "",
    ProductNameURL: "",
    ProductTagline: "",            // naya
    CategoryID: "",
    OccasionIDs: [],
    ProductColors: [],
    ProductImage: null,
    ProductBannerImage: null,
    ProductBannerImage1: null,
    ProductBannerImage2: null,
    ProductBannerImage3: null,
    ProductBannerImage4: null,
    Description: "",
    SpecificationDescription: "",
    ReturnPolicyDescription: "",
    ShippingPolicyDescription: "",
    MetaTitle: "",
    MetaKeywords: "",
    MetaDescriptions: "",
    MetaSchema: "",
    ActiveStatus: false,
    DisplayOrder: 0,
    DisplayOnExclusive: false,     // naya
    DisplayOnHome: false,     // naya
  });
  const [productCode, setProductCode] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [previewBanner, setPreviewBanner] = useState("");
  const [previewBannerImages, setPreviewBannerImages] = useState(["", "", "", ""]);
  useEffect(() => {
    if (productData?.success) {
      const data = productData.data;
      setFormData({
        ProductName: data.ProductName || "",
        ProductNameURL: data.ProductNameURL || "",
        ProductTagline: data.ProductTagline || "",                    // naya
        ProductSmallDescription: data.ProductSmallDescription || "",                    // naya
        CategoryID: data.CategoryID == null ? "" : String(data.CategoryID),
        OccasionIDs: Array.isArray(data.OccasionIDs) ? data.OccasionIDs.map(String) : [],
        ProductColors: Array.isArray(data.ProductColors)
          ? data.ProductColors.map((color) => ({
            ColorID: Number(color.ColorID),
            ProductMRP: String(color.ProductMRP ?? 0),
            ProductSalePrice: String(color.ProductSalePrice ?? 0),
            ProductOldStock: String(color.ProductOldStock ?? 0),
            ProductTotalStock: String(color.ProductTotalStock ?? 0),
            ProductNewStock: "0",
            ProductOutOfStock: String(color.ProductOutOfStock ?? 0),
          }))
          : [],
        ProductImage: null,
        ProductBannerImage: null,
        ProductBannerImage1: null,
        ProductBannerImage2: null,
        ProductBannerImage3: null,
        ProductBannerImage4: null,
        Description: data.Description || "",
        SpecificationDescription: data.SpecificationDescription || "",
        ReturnPolicyDescription: data.ReturnPolicyDescription || "",
        ShippingPolicyDescription: data.ShippingPolicyDescription || "",
        MetaTitle: data.MetaTitle || "",
        MetaKeywords: data.MetaKeywords || "",
        MetaDescriptions: data.MetaDescriptions || "",
        MetaSchema: data.MetaSchema || "",
        ActiveStatus: data.ActiveStatus === 1,
        DisplayOrder: data.DisplayOrder ?? 0,
        DisplayOnExclusive: Number(data.DisplayOnExclusive) === 1,    // naya
        DisplayOnHome: Number(data.DisplayOnHome) === 1,    // naya
      });
      setProductCode(data.ProductCode || "");
      setPreviewImage(data.ProductImage ? `/OnlineImages/ProductImages/${data.ProductImage}` : "",);
      setPreviewBanner(data.ProductBannerImage ? `/OnlineImages/ProductImages/${data.ProductBannerImage}` : "",);
      setPreviewBannerImages([
        data.ProductBannerImage1 ? `/OnlineImages/ProductImages/${data.ProductBannerImage1}` : "",
        data.ProductBannerImage2 ? `/OnlineImages/ProductImages/${data.ProductBannerImage2}` : "",
        data.ProductBannerImage3 ? `/OnlineImages/ProductImages/${data.ProductBannerImage3}` : "",
        data.ProductBannerImage4 ? `/OnlineImages/ProductImages/${data.ProductBannerImage4}` : "",
      ]);
    }
    else if (!ProductID && maxOrderData?.maxOrder !== undefined) {
      setFormData((prev) => ({
        ...prev,
        DisplayOrder: maxOrderData.maxOrder + 1,
      }));
    }
  }, [productData, maxOrderData, ProductID]);
  const handleInput = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  const handleFileRename = (file, nameSuffix) => {
    const ext = file.name.split(".").pop();
    const slug = formData.ProductNameURL?.replace(/\s+/g, "-") || "product";
    return new File([file], `${slug}${nameSuffix}.${ext}`, { type: file.type });
  };

  const validationRules = {
    ProductName: {
      required: true,
      requiredMessage: "Please enter a title.",
    },
    ProductNameURL: {
      required: true,
      requiredMessage: "Please enter a URL.",
    },
    CategoryID: {
      required: true,
      requiredMessage: "Please select a category.",
    },
    ProductImage: {
      required: !ProductID,
      requiredMessage: "Please upload an image.",
    },
  };

  const handleSubmit = async () => {
    const requiredPermission = ProductID ? pagePermission.CanWrite : pagePermission.CanAdd;
    if (requiredPermission !== 1) {
      toast.error(
        `You do not have permission to ${ProductID ? "edit" : "add"} product post`,
      );
      return;
    }
    if (areOccasionsLoading || occasionLoadError) {
      toast.error("Occasion choices are unavailable. Please wait or refresh and try again.");
      return;
    }
    if (areColorsLoading || colorLoadError) {
      toast.error("Color choices are unavailable. Please wait or refresh and try again.");
      return;
    }
    const invalidColorStock = formData.ProductColors.some((color) => {
      return [
        color.ProductMRP,
        color.ProductSalePrice,
        color.ProductNewStock,
      ].some((value) => value === "" || !Number.isInteger(Number(value)) || Number(value) < 0) ||
        [
          color.ProductMRP,
          color.ProductSalePrice,
          color.ProductNewStock,
        ].some((value) => Number(value) > 2147483647) ||
        !["0", "1"].includes(String(color.ProductOutOfStock));
    });
    if (invalidColorStock) {
      toast.error("Enter valid non-negative whole-number prices and stock additions for each selected color.");
      return;
    }
    const invalidSalePrice = formData.ProductColors.some(
      (color) => Number(color.ProductSalePrice) >= Number(color.ProductMRP),
    );
    if (invalidSalePrice) {
      toast.error("Sale price must be less than MRP for every selected color.");
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
      if (key === "ProductImage" && value instanceof File) {
        data.append("ProductImage", handleFileRename(value, ""));
      } else if (key === "ProductBannerImage" && value instanceof File) {
        data.append("ProductBannerImage", handleFileRename(value, "-banner"));
      } else if (/^ProductBannerImage[1-4]$/.test(key) && value instanceof File) {
        const index = Number(key.slice(-1));
        data.append(key, handleFileRename(value, `-banner-${index}`));
      } else if (key === "ActiveStatus" || key === "DisplayOnExclusive" || key === "DisplayOnHome") {
        data.append(key, value ? "1" : "0");
      } else if (typeof value === "string" || typeof value === "number") {
        data.append(key, value.toString());
      }
    });
    data.append("UpdatedBy", "Admin Panel");
    data.append("OccasionIDs", JSON.stringify(formData.OccasionIDs));
    data.append("ProductColors", JSON.stringify(formData.ProductColors));
    if (ProductID) {
      data.append("ProductID", ProductID);
    }
    try {
      const res = await saveOrUpdateProduct(data).unwrap();
      if (res.success) {
        toast.success(res.message);
        router.push("/legacy-of-marwar-admin/manage-product");
      } else {
        toast.error(res.message || "Save failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error?.data?.message || "Something went wrong");
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
            <h1>{ProductID ? "Update product" : "Create a product"}</h1>
            <p className={styles.subtitle}>Add your article details, images, and search metadata.</p>
          </div>
          <Link href="/legacy-of-marwar-admin/manage-product" className={styles.headerBack}>Back to products</Link>
        </div>
        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="productCategory">Category*</label>
            <select
              id="productCategory"
              value={formData.CategoryID}
              disabled={areCategoriesLoading || categoryLoadError}
              onChange={(event) => {
                handleInput("CategoryID", event.target.value);
                setFormErrors((previous) => ({ ...previous, CategoryID: "" }));
              }}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.CategoryID} value={category.CategoryID}>
                  {category.CategoryName}
                  {Number(category.ActiveStatus) !== 1 ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
            {categoryLoadError && <p className="error">Unable to load categories. Refresh and try again.</p>}
            {formErrors.CategoryID && <p className="error">{formErrors.CategoryID}</p>}
          </div>
          <div className="form-group">
            <label>Product Title*</label>
            <input
              type="text"
              placeholder="e.g. Women flexible bangle bracelet"
              value={formData.ProductName ?? ""}
              onChange={(e) => {
                const val = e.target.value;

                handleInput("ProductName", val);

                if (!ProductID) {
                  handleInput("ProductNameURL", generateSlug(val));

                  handleInput("MetaTitle", `${val} | Legacy Of Marwar`);
                }

                setFormErrors((prev) => ({
                  ...prev,
                  ProductName: "",
                }));
              }}
            />

            {formErrors.ProductName && (
              <p className="error">{formErrors.ProductName}</p>
            )}
          </div>
          <div className="form-group">
            <label>Product URL*</label>

            <input
              type="text"
              placeholder="e.g. women-flexible-bangle-bracelet"
              value={formData.ProductNameURL ?? ""}
              onChange={(e) => handleInput("ProductNameURL", e.target.value)}
            />
          </div>
        </div>
        <div className="form-group-row">
          <div className="form-group" style={{ display: "none" }}>
            <label htmlFor="productCode">Product Code</label>
            <input
              id="productCode"
              type="text"
              value={productCode || (ProductID ? "" : "Generated automatically on save")}
              readOnly
            />

            {formErrors.ProductNameURL && (
              <p className="error">{formErrors.ProductNameURL}</p>
            )}
          </div>
        </div>
        <div className="form-group-row">
          <div className="form-group">
            <label>Product Tagline</label>
            <input
              type="text"
              maxLength={255}
              placeholder="e.g. Handcrafted 925 sterling silver"
              value={formData.ProductTagline ?? ""}
              onChange={(e) => handleInput("ProductTagline", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Product Small Description</label>
            <input
              type="text"
              maxLength={255}
              placeholder="e.g. Handcrafted 925 sterling silver"
              value={formData.ProductSmallDescription ?? ""}
              onChange={(e) => handleInput("ProductSmallDescription", e.target.value)}
            />
          </div>
        </div>
        <section className={styles.occasionSection}>
          <div className={styles.occasionHeading}>
            <div>
              <p className={styles.eyebrow}>PRODUCT PLACEMENT</p>
              <h2>Occasions</h2>
            </div>
            <span>Select any number</span>
          </div>
          {occasionLoadError ? (
            <p className="error">Unable to load occasions. Refresh and try again.</p>
          ) : areOccasionsLoading ? (
            <p className={styles.fieldHint}>Loading occasions...</p>
          ) : occasions.length === 0 ? (
            <p className={styles.fieldHint}>No occasions are available.</p>
          ) : (
            <div className={styles.occasionGrid}>
              {occasions.map((occasion) => {
                const occasionID = String(occasion.OccasionID);
                return (
                  <label className={styles.occasionOption} key={occasionID}>
                    <input
                      type="checkbox"
                      checked={formData.OccasionIDs.includes(occasionID)}
                      onChange={(event) => {
                        setFormData((previous) => ({
                          ...previous,
                          OccasionIDs: event.target.checked
                            ? [...previous.OccasionIDs, occasionID]
                            : previous.OccasionIDs.filter((id) => id !== occasionID),
                        }));
                      }}
                    />
                    <span>{occasion.OccasionName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.productColorSection}>
          <div className={styles.occasionHeading}>
            <div>
              <p className={styles.eyebrow}>PRODUCT VARIANTS</p>
              <h2>Color-wise price &amp; stock</h2>
            </div>
            <span>Set prices per color, then enter any stock to add.</span>
          </div>
          {colorLoadError ? (
            <p className="error">Unable to load colors. Refresh and try again.</p>
          ) : areColorsLoading ? (
            <p className={styles.fieldHint}>Loading colors...</p>
          ) : colors.length === 0 ? (
            <p className={styles.fieldHint}>No colors are available. Add colors before configuring product variants.</p>
          ) : (
            <>
              <div className={styles.occasionGrid}>
                {colors.map((color) => {
                  const colorID = Number(color.ColorID);
                  const selected = formData.ProductColors.some((item) => item.ColorID === colorID);
                  return (
                    <label className={styles.occasionOption} key={colorID}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          setFormData((previous) => ({
                            ...previous,
                            ProductColors: event.target.checked
                              ? [
                                ...previous.ProductColors,
                                {
                                  ColorID: colorID,
                                  ProductMRP: "0",
                                  ProductSalePrice: "0",
                                  ProductOldStock: "0",
                                  ProductTotalStock: "0",
                                  ProductNewStock: "0",
                                  ProductOutOfStock: "0",
                                },
                              ]
                              : previous.ProductColors.filter((item) => item.ColorID !== colorID),
                          }));
                        }}
                      />
                      <span
                        className={styles.colorSwatch}
                        style={{ backgroundColor: color.ColorCode || "#ffffff" }}
                      />
                      <span>
                        {color.ColorName}
                        {Number(color.ActiveStatus) !== 1 ? " (Inactive)" : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
              {formData.ProductColors.length > 0 && (
                <div className={styles.productColorList}>
                  {formData.ProductColors.map((productColor) => {
                    const color = colors.find((item) => Number(item.ColorID) === productColor.ColorID);
                    return (
                      <fieldset className={styles.productColorCard} key={productColor.ColorID}>
                        <legend>
                          <span
                            className={styles.colorSwatch}
                            style={{ backgroundColor: color?.ColorCode || "#ffffff" }}
                          />
                          {color?.ColorName || `Color #${productColor.ColorID}`}
                        </legend>
                        <div className={styles.productColorFields}>
                          {[
                            ["ProductMRP", "MRP", false],
                            ["ProductSalePrice", "Sale Price", false],
                            ["ProductTotalStock", "Available", true],
                            ["ProductOldStock", "Last", true],
                            ["ProductNewStock", "New Stock", false],
                          ].map(([field, label, readOnly]) => (
                            <label className={styles.productColorField} key={field}>
                              <span>{label}</span>
                              <input
                                type="number"
                                min="0"
                                max="2147483647"
                                step="1"
                                value={productColor[field]}
                                readOnly={readOnly}
                                onChange={(event) => {
                                  if (readOnly) return;
                                  const value = event.target.value;
                                  setFormData((previous) => ({
                                    ...previous,
                                    ProductColors: previous.ProductColors.map((item) =>
                                      item.ColorID === productColor.ColorID
                                        ? { ...item, [field]: value }
                                        : item,
                                    ),
                                  }));
                                }}
                              />
                            </label>
                          ))}
                          <label className={styles.productColorField}>
                            <span>Stock Status</span>
                            <select
                              value={productColor.ProductOutOfStock}
                              onChange={(event) => {
                                const value = event.target.value;
                                setFormData((previous) => ({
                                  ...previous,
                                  ProductColors: previous.ProductColors.map((item) =>
                                    item.ColorID === productColor.ColorID
                                      ? { ...item, ProductOutOfStock: value }
                                      : item,
                                  ),
                                }));
                              }}
                            >
                              <option value="0">In Stock</option>
                              <option value="1">Out of Stock</option>
                            </select>
                          </label>
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <div className={`form-group-row file-uploade-sec ${styles.uploadRow}`}>
          <div className={styles.uploadColumn}>
            <div className="form-group">
              <label>Thumbnail Image*</label>
              <p className={styles.fieldHint}>Main image shown with your article.</p>

              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleInput("ProductImage", file);
                    setPreviewImage(URL.createObjectURL(file));

                    setFormErrors((prev) => ({
                      ...prev,
                      ProductImage: "",
                    }));
                  }
                }}
              />

              {previewImage && (
                <img src={previewImage} alt="Thumbnail preview" className={styles.imagePreview} />
              )}
              {formErrors.ProductImage && (
                <p className="error">{formErrors.ProductImage}</p>
              )}
            </div>
          </div>

          <div className={styles.uploadColumn}>
            <div className="form-group">
              <label>Thumbnail Image 2*</label>
              <p className={styles.fieldHint}>Wide image used at the top of the article.</p>
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleInput("ProductBannerImage", file);

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
        <div className={`form-group-row file-uploade-sec ${styles.uploadRow}`}>
          {[1, 2, 3, 4].map((imageNumber) => {
            const fieldName = `ProductBannerImage${imageNumber}`;
            return (
              <div className={styles.uploadColumn} key={fieldName}>
                <div className="form-group">
                  <label> {imageNumber == 3 ? "Home Image" : imageNumber == 4 ? "Model Image" : `Image ${imageNumber + 2}`}</label>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleInput(fieldName, file);
                      setPreviewBannerImages((previous) => {
                        const next = [...previous];
                        next[imageNumber - 1] = URL.createObjectURL(file);
                        return next;
                      });
                    }}
                  />
                  {previewBannerImages[imageNumber - 1] && (
                    <img
                      src={previewBannerImages[imageNumber - 1]}
                      alt={`Additional banner ${imageNumber} preview`}
                      className={styles.bannerPreview}
                    />
                  )}
                </div>
              </div>
            );
          })}
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
        <div className={`form-group ${styles.descriptionGroup}`}>
          <label>Specification Description</label>
          <div className={styles.editorFrame}>
            <SunEditor
              lang="en"
              name="SpecificationDescription"
              width="100%"
              height="200px"
              setContents={formData.SpecificationDescription || ""}
              onChange={(content) => handleInput("SpecificationDescription", content)}
              setOptions={editorOptions}
            />
          </div>
        </div>
        <div className={`form-group ${styles.descriptionGroup}`}>
          <label>Return Policy Description</label>
          <div className={styles.editorFrame}>
            <SunEditor
              lang="en"
              name="ReturnPolicyDescription"
              width="100%"
              height="200px"
              setContents={formData.ReturnPolicyDescription || ""}
              onChange={(content) => handleInput("ReturnPolicyDescription", content)}
              setOptions={editorOptions}
            />
          </div>
        </div>
        <div className={`form-group ${styles.descriptionGroup}`}>
          <label>Shipping Policy Description</label>
          <div className={styles.editorFrame}>
            <SunEditor
              lang="en"
              name="ShippingPolicyDescription"
              width="100%"
              height="200px"
              setContents={formData.ShippingPolicyDescription || ""}
              onChange={(content) => handleInput("ShippingPolicyDescription", content)}
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
          <div className="form-group-row statusac" style={{ display: "none" }}>
            <input
              type="checkbox"
              id="chkDisplayOnExclusive"
              checked={formData.DisplayOnExclusive}
              onChange={(e) => handleInput("DisplayOnExclusive", e.target.checked)}
            />
            <label htmlFor="chkDisplayOnExclusive">Display on Exclusive</label>
          </div>
          <div className="form-group-row statusac">
            <input
              type="checkbox"
              id="chkDisplayOnHome"
              checked={formData.DisplayOnHome}
              onChange={(e) => handleInput("DisplayOnHome", e.target.checked)}
            />
            <label htmlFor="chkDisplayOnHome">Display on Home</label>
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
              placeholder="e.g. Women flexible bangle bracelet | Legacy Of Marwar"
              value={formData.MetaTitle ?? ""}
              onChange={(e) => handleInput("MetaTitle", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Keywords</label>
            <input
              type="text"
              placeholder="e.g. women, flexible, bangle, bracelet"
              value={formData.MetaKeywords ?? ""}
              onChange={(e) => handleInput("MetaKeywords", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Descriptions</label>
            <input
              type="text"
              placeholder="e.g. Women flexible bangle bracelet | Legacy Of Marwar"
              value={formData.MetaDescriptions ?? ""}
              onChange={(e) => handleInput("MetaDescriptions", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="block-label">Meta Schema</label>
            <input
              type="text"
              placeholder='e.g. {"@context": "https://schema.org", "@type": "ProductPosting"}'
              value={formData.MetaSchema ?? ""}
              onChange={(e) => handleInput("MetaSchema", e.target.value)}
            />
          </div>
        </section>
        <div className={styles.formActions}>
          <Link href="/legacy-of-marwar-admin/manage-product" className={styles.cancelButton}>
            Cancel
          </Link>
          <button className={`submit-btn ${styles.saveButton}`} onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : ProductID ? "Save changes" : "Publish product"}
          </button>
        </div>
      </div>
    </main>
  );
}
