"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Fancybox } from "@fancyapps/ui";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Button from "../../atoms/Button";
import SwiperButton from "../../atoms/SwiperButton";
import "swiper/css";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { useModal } from "@/hooks/useModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateWishlistCount } from "@/store/slice/authSlice";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import {
  useAddProductToWishlistMutation,
  useRemoveProductFromWishlistMutation,
} from "@/store/backendSlice/customerWishlistAPISlice";

interface Breadcrumps {
  linkHref: string;
  title: string;
}

interface GalleryItem {
  imgSrc: string;
}

interface AccordionItem {
  id: number;
  title: string;
  desc: string;
}

const BreadcrumpsData: Breadcrumps[] = [
  { linkHref: "/", title: "Home" },
  { linkHref: "/products", title: "Product" },
];

// fallback gallery, used only when the product has no images
const defaultGallery: GalleryItem[] = [
  { imgSrc: "/images/other/gallery1.jpg" },
  { imgSrc: "/images/other/gallery2.png" },
  { imgSrc: "/images/other/gallery3.jpg" },
];

// swatch colours by name
const COLOR_HEX: Record<string, string> = {
  silver: "#DFDFDF",
  gold: "#9A7C47",
  black: "#000000",
  "rose gold": "#B76E79",
};

// Buy now ke baad kahan jana hai (apne checkout route se badlo)
const BUY_NOW_URL = "/shopping-cart"; // ya "/shipping-address"

interface ProductInfoProps {
  productInfo: any;
  id: string | number;
}

export default function ProductInfo({ productInfo, id }: ProductInfoProps) {
  const productdata: any = productInfo?.product ?? {};
  const colors: any[] = productInfo?.colors ?? [];

  const customerID = Number(id) || 0;

  // ---------- Wishlist hooks ----------
  const dispatch = useAppDispatch();
  const { openModal } = useModal();
  const totalWishlist = useAppSelector((state: any) =>
    Number(state.auth?.totalWishlist ?? 0),
  );
  const [addProductToWishlist, { isLoading: isAdding }] =
    useAddProductToWishlistMutation();
  const [removeProductFromWishlist, { isLoading: isRemoving }] =
    useRemoveProductFromWishlistMutation();

  // ---------- Cart hooks ----------
  const router = useRouter();
  const { addToCart } = useCart();

  const apiWishlisted = Number(productdata.IsWishlisted ?? 0) === 1;
  const [isWishlisted, setLocalWishlisted] = useState<boolean>(apiWishlisted);

  useEffect(() => {
    setLocalWishlisted(apiWishlisted);
  }, [apiWishlisted, productdata.ProductID]);

  // ---------- Gallery ----------
  const IMG_PATH = "/OnlineImages/ProductImages/";

  const dbGallery: GalleryItem[] = [
    productdata.ProductImage,
    productdata.ProductBannerImage,
    productdata.ProductBannerImage1,
    productdata.ProductBannerImage2,
    //productdata.ProductBannerImage3,
    //productdata.ProductBannerImage4,
  ]
    .filter((img) => img && String(img).trim() !== "")
    .map((img) => ({ imgSrc: `${IMG_PATH}${img}` }));

  const GalleryData: GalleryItem[] =
    dbGallery.length > 0 ? dbGallery : defaultGallery;

  // ---------- Accordion ----------
  const AccordionData: AccordionItem[] = [
    { id: 1, title: "Description", desc: productdata.Description },
    {
      id: 2,
      title: "Specification",
      desc: productdata.SpecificationDescription,
    },
    {
      id: 3,
      title: "Shipping & Returns",
      desc: productdata.ReturnPolicyDescription,
    },
    {
      id: 4,
      title: "Shipping Policy",
      desc: productdata.ShippingPolicyDescription,
    },
  ]
    .map((item) => ({ ...item, desc: String(item.desc ?? "").trim() }))
    .filter((item) => item.desc !== "");

  // ---------- State ----------
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorID, setSelectedColorID] = useState<number | null>(null);

  const openAccordion = activeAccordion ?? AccordionData[0]?.id ?? 0;
  const activeImg = GalleryData[activeIndex]?.imgSrc ?? GalleryData[0].imgSrc;

  // ---------- Selected colour -> price ----------
  const selectedColor =
    colors.find((c: any) => Number(c.ColorID) === selectedColorID) ?? colors[0];

  const formatPrice = (v: any) =>
    `₹ ${Number(v ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const MIN_QTY = 1;
  const MAX_QTY = 10;
  const decrement = () => setQuantity((q) => Math.max(MIN_QTY, q - 1));
  const increment = () => setQuantity((q) => Math.min(MAX_QTY, q + 1));
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setQuantity(NaN);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      setQuantity(Math.min(MAX_QTY, Math.max(MIN_QTY, num)));
    }
  };
  const handleQtyBlur = () => {
    if (isNaN(quantity)) setQuantity(MIN_QTY);
  };

  // ---------- Cart actions ----------
  // Product + selected color cart me add karo. true = add hua, false = nahi hua
  const addCurrentProductToCart = (): boolean => {
    if (!productdata.ProductID) {
      toast.error("Product not found");
      return false;
    }

    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return false;
    }

    const qty = isNaN(quantity) ? MIN_QTY : quantity;

    addToCart({
      productID: Number(productdata.ProductID),
      productName: productdata.ProductName,
      productNameUrl: productdata.ProductNameURL ?? productdata.ProductNameUrl,
      productImage: productdata.ProductImage
        ? `${IMG_PATH}${productdata.ProductImage}`
        : "",
      categoryName: productdata.CategoryName,
      colorID: Number(selectedColor?.ColorID ?? 0),
      colorName: selectedColor?.ColorName ?? "",
      productPrice: Number(selectedColor?.ProductSalePrice ?? 0), // GST included
      productMRP: Number(selectedColor?.ProductMRP ?? 0),
      productGSTRate: Number(
        selectedColor?.ProductGSTRate ?? productdata.ProductGSTRate ?? 12,
      ),
      ProductWeight: Number(productdata.ProductWeight ?? 0), // gram
      quantity: qty,
    });
    return true;
  };

  const handleAddToBag = () => {
    addCurrentProductToCart();
  };

  const handleBuyNow = () => {
    if (addCurrentProductToCart()) router.push(BUY_NOW_URL);
  };

  useEffect(() => {
    setActiveIndex(0);
    setActiveAccordion(null);
  }, [productdata.ProductID]);

  useEffect(() => {
    Fancybox.bind("[data-fancybox='product-gallery']", {});
    return () => Fancybox.destroy();
  }, []);

  // ---------- Wishlist actions ----------
  const isWishlistLoading = isAdding || isRemoving;

  const removeFromWishlist = async (
    productID: number,
    customerID: number,
  ): Promise<void> => {
    const previousValue = isWishlisted;
    setLocalWishlisted(false);
    try {
      const response = await removeProductFromWishlist({
        CustomerID: customerID,
        ProductID: productID,
      }).unwrap();
      dispatch(updateWishlistCount(Math.max(0, totalWishlist - 1)));
      toast.success(response?.message || "Product removed from wishlist.");
    } catch (error: any) {
      setLocalWishlisted(previousValue);
      toast.error(
        error?.data?.message || "Failed to remove product from wishlist.",
      );
      console.error("Remove wishlist error:", error);
    }
  };

  const AddToWishlist = async (
    productID: number,
    customerID: number,
  ): Promise<void> => {
    const previousValue = isWishlisted;
    setLocalWishlisted(true);
    try {
      const response = await addProductToWishlist({
        CustomerID: customerID,
        ProductID: productID,
        UpdatedBy: "Customer",
      }).unwrap();
      dispatch(updateWishlistCount(totalWishlist + 1));
      toast.success(response?.message || "Product added to wishlist.");
    } catch (error: any) {
      setLocalWishlisted(previousValue);
      toast.error(error?.data?.message || "Failed to add product to wishlist.");
      console.error("Add wishlist error:", error);
    }
  };

  const handleWishlistClick = async (
    productID: number,
    customerID: number,
  ): Promise<void> => {
    if (customerID < 1) {
      openModal("loginPop");
      return;
    }
    if (productID < 1 || isWishlistLoading) return;

    if (isWishlisted) {
      await removeFromWishlist(productID, customerID);
    } else {
      await AddToWishlist(productID, customerID);
    }
  };

  const whatsappLink = (productName: string) => {
    const phone = "919811887651";
    const message = `Hello Team Legacy of Marwar! I am interested in one of your products ${productName}. Please touch base with me.`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    return isMobile
      ? `https://wa.me/${phone}?text=${message}`
      : `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
  };

  return (
    <section>
      <div className="product-detail-container">
        <div className="container-fluid">
          <div className="detail-product-wrap">
            <div className="colA">
              <div className="image_wrapper">
                {GalleryData.map((item, index) => (
                  <figure key={index} className="image_col">
                    <Link href={item.imgSrc} data-fancybox="product-gallery">
                      <Image
                        src={item.imgSrc}
                        width={590}
                        height={590}
                        alt="display_img"
                        unoptimized
                      ></Image>
                    </Link>
                  </figure>
                ))}
                {/* <div className="display_image">
                  <figure>
                    <Link href={activeImg} data-fancybox="product-gallery">
                      <Image
                        key={activeImg}
                        src={activeImg}
                        width={590}
                        height={590}
                        alt="display_img"
                        unoptimized
                      ></Image>
                    </Link>
                  </figure>
                  <button
                    type="button"
                    className={`wishlistBtn ${isWishlisted ? "active" : ""}`}
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                    aria-pressed={isWishlisted}
                    disabled={isWishlistLoading}
                    onClick={() =>
                      handleWishlistClick(
                        Number(productdata.ProductID),
                        customerID,
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                      viewBox="0 0 1024 1024"
                    >
                      <path
                        fill="#9A7C47"
                        d="M923 283.6a260 260 0 0 0-56.9-82.8a264.4 264.4 0 0 0-84-55.5A265.3 265.3 0 0 0 679.7 125c-49.3 0-97.4 13.5-139.2 39q-15 9.15-28.5 20.1q-13.5-10.95-28.5-20.1c-41.8-25.5-89.9-39-139.2-39c-35.5 0-69.9 6.8-102.4 20.3c-31.4 13-59.7 31.7-84 55.5a258.4 258.4 0 0 0-56.9 82.8c-13.9 32.3-21 66.6-21 101.9c0 33.3 6.8 68 20.3 103.3c11.3 29.5 27.5 60.1 48.2 91c32.8 48.9 77.9 99.9 133.9 151.6c92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3c56-51.7 101.1-102.7 133.9-151.6c20.7-30.9 37-61.5 48.2-91c13.5-35.3 20.3-70 20.3-103.3c.1-35.3-7-69.6-20.9-101.9M512 814.8S156 586.7 156 385.5C156 283.6 240.3 201 344.3 201c73.1 0 136.5 40.8 167.7 100.4C543.2 241.8 606.6 201 679.7 201c104 0 188.3 82.6 188.3 184.5c0 201.2-356 429.3-356 429.3"
                      ></path>
                      <path
                        fill="currentColor"
                        fillOpacity={0}
                        d="M679.7 201c-73.1 0-136.5 40.8-167.7 100.4C480.8 241.8 417.4 201 344.3 201c-104 0-188.3 82.6-188.3 184.5c0 201.2 356 429.3 356 429.3s356-228.1 356-429.3C868 283.6 783.7 201 679.7 201"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className="image_gallery">
                  <div className="swiper-nav center-full group primary">
                    <SwiperButton classname="swiper-prev gallery-prev"></SwiperButton>
                    <SwiperButton classname="swiper-next gallery-next"></SwiperButton>
                  </div>
                  <Swiper
                    modules={[Navigation]}
                    className="gallery_slider"
                    speed={800}
                    navigation={{
                      prevEl: ".gallery-prev",
                      nextEl: ".gallery-next",
                    }}
                    breakpoints={{
                      0: {
                        slidesPerView: 3,
                        spaceBetween: 10,
                      },
                      540: {
                        slidesPerView: 3,
                        spaceBetween: 10,
                      },
                      768: {
                        slidesPerView: 4,
                        spaceBetween: 10,
                      },
                      992: {
                        slidesPerView: 4,
                        spaceBetween: 15,
                      },
                    }}
                  >
                    {GalleryData.map((item, index) => (
                      <SwiperSlide key={index}>
                        <div
                          className={`gallery_col ${index === activeIndex ? "active" : ""}`}
                          onClick={() => setActiveIndex(index)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setActiveIndex(index)
                          }
                        >
                          <Image
                            src={item.imgSrc}
                            width={122}
                            height={107}
                            alt="gallery-img"
                            unoptimized
                          ></Image>
                        </div>
                      </SwiperSlide>
                    ))}
                    {GalleryData.map(
                      (item, i) =>
                        i !== activeIndex && (
                          <a
                            key={i}
                            href={item.imgSrc}
                            data-fancybox="product-gallery"
                            hidden
                          />
                        ),
                    )}
                  </Swiper>
                </div> */}
              </div>
            </div>
            <div className="colB">
              <div className="product_info_wrap">
                <ul className="breadcrumbs">
                  {BreadcrumpsData.map((item) => (
                    <li key={item.title}>
                      <Link href={item.linkHref}>{item.title}</Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/products/${productdata.CategoryNameURL ?? ""}`}
                    >
                      {productdata.CategoryName}
                    </Link>
                  </li>
                  <li>
                    <Link href={`#`} className="active">
                      {productdata.ProductName}
                    </Link>
                  </li>
                </ul>
                <h1 className="pro_title">{productdata.ProductName}</h1>
                <div className="price_wrap">
                  <p className="sp">
                    {formatPrice(selectedColor?.ProductSalePrice)}
                  </p>
                  {/* {selectedColor?.ProductMRP > selectedColor?.ProductSalePrice && (
                    <p className="mrp">
                      {formatPrice(selectedColor?.ProductMRP)}
                    </p>
                  )} */}
                </div>
                <p className="disclm">
                  {productdata?.ProductSmallDescription || ""}
                </p>
                {colors.length > 1 && (
                  <div className="color_wrap">
                    <h6>Colors</h6>
                    <ul>
                      {colors.map((c: any) => {
                        const name = String(c.ColorName ?? "");
                        return (
                          <li key={c.ColorID ?? name}>
                            <input
                              type="radio"
                              name="color"
                              id={name.toLowerCase()}
                              checked={
                                Number(selectedColor?.ColorID) ===
                                Number(c.ColorID)
                              }
                              onChange={() =>
                                setSelectedColorID(Number(c.ColorID))
                              }
                            />
                            <div
                              className="in-bx"
                              style={{
                                background:
                                  COLOR_HEX[name.toLowerCase()] ?? "#DFDFDF",
                              }}
                            ></div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <div className="value_wrap">
                  <button
                    type="button"
                    onClick={decrement}
                    disabled={quantity <= MIN_QTY}
                    aria-label="Decrease quantity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      ></path>
                    </svg>
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={isNaN(quantity) ? "" : quantity}
                    onChange={handleQtyChange}
                    onBlur={handleQtyBlur}
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={increment}
                    disabled={quantity >= MAX_QTY}
                    aria-label="Increase quantity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M12 20v-8m0 0V4m0 8h8m-8 0H4"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className="btn_wrap">
                  {/* <div className="peacock_btn">
                    <Button
                      classname="primary-border"
                      buttonText="Make it Yours"
                      onClick={() =>
                        openModal("enquiryPop", {
                          productName: productdata?.ProductName || "",
                          enquiryFor: productdata?.ProductName || "",
                        })
                      }
                    />
                    <Image
                      className="btn-peacock"
                      src="/images/product/btn-peacock.svg"
                      width={50}
                      height={50}
                      alt="btn-vector"
                    ></Image>
                  </div> */}
                  <Button
                    classname="solid-primary"
                    buttonText="buy now"
                    onClick={handleBuyNow}
                  />
                  <Button
                    classname="primary-border"
                    buttonText="add to bag"
                    onClick={handleAddToBag}
                  />
                  {/* <Button
                    classname="primary-border try-on"
                    buttonText="try on"
                    svgpath="/icon/lens.svg"
                  /> */}
                  <Button
                    linkHref={whatsappLink(productdata.ProductName)}
                    target="_blank"
                    classname="whatsapp solid-primary"
                    svgpath={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                      >
                        <g fill="none">
                          <g clipPath="url(#SVGXv8lpc2Y)">
                            <path
                              fill="currentColor"
                              fillRule="evenodd"
                              d="M17.415 14.382c-.298-.149-1.759-.867-2.031-.967s-.47-.148-.669.15c-.198.297-.767.966-.94 1.164c-.174.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.019-.458.13-.606c.134-.133.297-.347.446-.52s.198-.298.297-.497c.1-.198.05-.371-.025-.52c-.074-.149-.668-1.612-.916-2.207c-.241-.579-.486-.5-.668-.51c-.174-.008-.372-.01-.57-.01s-.52.074-.792.372c-.273.297-1.04 1.016-1.04 2.479c0 1.462 1.064 2.875 1.213 3.074s2.095 3.2 5.076 4.487c.71.306 1.263.489 1.694.625c.712.227 1.36.195 1.872.118c.57-.085 1.758-.719 2.006-1.413s.247-1.289.173-1.413s-.272-.198-.57-.347m-5.422 7.403h-.004a9.87 9.87 0 0 1-5.032-1.378l-.36-.214l-3.742.982l.999-3.648l-.235-.374a9.86 9.86 0 0 1-1.511-5.26c.002-5.45 4.436-9.884 9.889-9.884a9.8 9.8 0 0 1 6.988 2.899a9.82 9.82 0 0 1 2.892 6.992c-.002 5.45-4.436 9.885-9.884 9.885m8.412-18.297A11.82 11.82 0 0 0 11.992 0C5.438 0 .102 5.335.1 11.892a11.86 11.86 0 0 0 1.587 5.945L0 24l6.304-1.654a11.9 11.9 0 0 0 5.684 1.448h.005c6.554 0 11.89-5.335 11.892-11.893a11.82 11.82 0 0 0-3.48-8.413"
                              clipRule="evenodd"
                            ></path>
                          </g>
                          <defs>
                            <clipPath id="SVGXv8lpc2Y">
                              <path fill="#fff" d="M0 0h24v24H0z"></path>
                            </clipPath>
                          </defs>
                        </g>
                      </svg>
                    }
                  />
                </div>
                <div className="accordion_wrapper">
                  {AccordionData.map((item) => (
                    <div
                      className={`accordion_col ${openAccordion === item.id ? "active" : ""}`}
                      onClick={() => setActiveAccordion(item.id)}
                      key={item.id}
                    >
                      <div className="accordion_title">
                        <h4>{item.title}</h4>
                        <div className="icon"></div>
                      </div>
                      <article>
                        <div
                          className="accordion_details website-content"
                          dangerouslySetInnerHTML={{ __html: item.desc }}
                        ></div>
                      </article>
                    </div>
                  ))}
                </div>
                <div className="options_available">
                  <div className="option_col">
                    <div className="icon">
                      <Image
                        src="/icon/shipping.svg"
                        width={35}
                        height={35}
                        alt="icon"
                      ></Image>
                    </div>
                    <p>Free Shipping In Worldwide</p>
                  </div>
                  <div className="option_col">
                    <div className="icon">
                      <Image
                        src="/icon/cod.svg"
                        width={35}
                        height={35}
                        alt="icon"
                      ></Image>
                    </div>
                    <p>Secure Payment</p>
                  </div>
                  <div className="option_col">
                    <div className="icon">
                      <Image
                        src="/icon/pure-silver.svg"
                        width={35}
                        height={35}
                        alt="icon"
                      ></Image>
                    </div>
                    <p>925 Pure Silver</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
