"use client";
import Image from "next/image";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import { useState, useRef, useEffect, useMemo } from "react";
import { Range, getTrackBackground } from "react-range";
import ListingCard from "../../molecules/ListingCard";
import { useGetProductDataQuery } from "@/store/frontendSlice/homePageAPISlice";
import { useSelector } from "react-redux";

const MIN = 0;
const MAX = 1000000;
const PAGE_SIZE = 20; // products shown per "Load More" click

type DropdownId = "category" | "price" | "color" | "sort";

interface FilterOption {
  label: string;
}

interface Category {
  CategoryName: string;
}

interface Color {
  ColorName: string;
}

const sortData: FilterOption[] = [
  { label: "Price: Low to High" },
  { label: "Price: High to Low" },
  { label: "Newest" },
];

interface ListingWrapperProps {
  categoryName?: string;
}

// ignore case and extra spaces when comparing
const norm = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export default function ListingWrapper({
  categoryName = "",
}: ListingWrapperProps) {
  const {
    user,
    isLoggedIn = false,
    accounts = [],
  } = useSelector((state: any) => state.auth ?? {});
  const CustomerID = Number(
    user?.CustomerID ??
      user?.customerID ??
      user?.CustomerId ??
      accounts?.[0]?.CustomerID ??
      accounts?.[0]?.customerID ??
      accounts?.[0]?.CustomerId ??
      0,
  );
  console.log("Final CustomerID:", CustomerID);
  const {
    data: productResponse,
    isLoading,
    isFetching,
    isError,
  } = useGetProductDataQuery(
    { CustomerID },
    { refetchOnMountOrArgChange: true },
  );

  const categoryData: FilterOption[] = (productResponse?.categories ?? []).map(
    (item: Category) => ({
      label: item.CategoryName,
    }),
  );

  const colorData: FilterOption[] = (productResponse?.color ?? []).map(
    (item: Color) => ({
      label: item.ColorName,
    }),
  );

  const productItem = (productResponse?.products ?? []).map((item: any) => ({
    sno: item.ProductID,
    ProductID: item.ProductID,
    linkHref: `/${item.ProductNameURL}`,
    imgSrc: item.ProductImage
      ? `/OnlineImages/ProductImages/${item.ProductImage}`
      : "/images/other/ring1.png",
    imghoverSrc: item.ProductBannerImage4
      ? `/OnlineImages/ProductImages/${item.ProductBannerImage4}`
      : "/images/other/ring1.png",
    title: item.ProductName,
    sp: `₹ ${Number(item.ProductSalePrice ?? 0).toLocaleString("en-IN")}.00`,
    mrp: `₹ ${Number(item.ProductMRP ?? item.ProductSalePrice ?? 0).toLocaleString("en-IN")}.00`,
    isWishlisted: Number(item.IsWishlisted ?? 0),
    itemID: Number(item.ItemID ?? 0),
    // extra fields used only for filtering / sorting
    _price: Number(item.ProductSalePrice ?? 0),
    _category: item.CategoryName ?? "",
    _color: String(item.ColorName ?? "")
      .trim()
      .toLowerCase(),
    desc: item.ProductTagline,
  }));
  console.log(productResponse);

  const { openModal, closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);
  const isFilterOpen = isModal === "filterPop";
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [price, setPrice] = useState<number[]>([MIN, MAX]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [activeDropdown, setActiveDropdown] = useState<DropdownId | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // dropdown choice wins, otherwise use the category passed from the page
  const activeCategory = selectedCategory || categoryName;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // go back to first page whenever a filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [price, activeCategory, selectedColors, sortBy]);

  // apply category + price + color filters and sorting
  const filteredProducts = useMemo(() => {
    const selected = selectedColors.map((c) => c.toLowerCase());

    // 1) filter every product-color row
    let list = productItem.filter((p: any) => {
      if (p._price < price[0] || p._price > price[1]) return false;
      if (activeCategory && norm(p._category) !== norm(activeCategory))
        return false;
      if (selected.length > 0 && !selected.includes(p._color)) return false;
      return true;
    });

    // 2) no color selected -> show each product only once (lowest price variant)
    if (selected.length === 0) {
      const map = new Map<number, any>();
      list.forEach((p: any) => {
        const existing = map.get(p.ProductID);
        if (!existing || p._price < existing._price) map.set(p.ProductID, p);
      });
      list = Array.from(map.values());
    }

    // 3) sort
    if (sortBy === "Price: Low to High")
      list = [...list].sort((a: any, b: any) => a._price - b._price);
    if (sortBy === "Price: High to Low")
      list = [...list].sort((a: any, b: any) => b._price - a._price);
    if (sortBy === "Newest")
      list = [...list].sort((a: any, b: any) => b.ProductID - a.ProductID);

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productResponse, price, activeCategory, selectedColors, sortBy]);

  const handlePriceRange = (range: number[]) => {
    setPrice(range);
  };

  const toggleColor = (name: string) => {
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const toggleDropdown = (id: DropdownId) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };
  const wrapClass = (id: DropdownId, extra = "") =>
    `adi-select-wrap ${extra} ${activeDropdown === id ? "active" : ""}`
      .replace(/\s+/g, " ")
      .trim();
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 991);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");

    const handleChange = (e: MediaQueryList | MediaQueryListEvent) => {
      setActiveDropdown(e.matches ? "category" : null);
    };

    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  return (
    <section className="listing_wrapper">
      <div
        className="list-filter-wrap"
        style={{ zIndex: isFilterOpen ? 11 : 7 }}
      >
        <div className="container">
          <div className="list-filter" ref={filterRef}>
            <div className="colA">
              <button
                type="button"
                className="filtr-btn"
                onClick={() => openModal("filterPop")}
              >
                <img src="/icon/sort.svg" className="svg" alt="" />
              </button>
            </div>
            <div
              className={`colB ${isMobile ? "model" : ""} ${isFilterOpen ? "is-open" : ""}`}
            >
              <div className="filter_wrap">
                <div className={wrapClass("category")}>
                  <div
                    className="label"
                    onClick={() => toggleDropdown("category")}
                  >
                    Category
                  </div>
                  <div className="adi-select-menu">
                    <article>
                      <ul>
                        {categoryData.map((item) => (
                          <li key={item.label.toLowerCase()}>
                            <input
                              type="radio"
                              name="category"
                              id={item.label.toLowerCase()}
                              checked={
                                norm(activeCategory) === norm(item.label)
                              }
                              onChange={() => setSelectedCategory(item.label)}
                            />
                            <div className="in-bx"></div>
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>
                </div>
                <div className={wrapClass("price", "price_select")}>
                  <div
                    className="label"
                    onClick={() => toggleDropdown("price")}
                  >
                    Price
                  </div>
                  <div className="adi-select-menu">
                    <article>
                      <div className="price_wrap">
                        <div className="upper-sec">
                          <h6>Price Range</h6>
                          <button
                            type="button"
                            className="reset-btn"
                            onClick={() => setPrice([MIN, MAX])}
                          >
                            Reset
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={21}
                              height={21}
                              viewBox="0 0 21 21"
                            >
                              <g
                                fill="none"
                                fillRule="evenodd"
                                stroke="#000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
                                <path d="M7.5 6.5h-4v-4" />
                              </g>
                            </svg>
                          </button>
                        </div>
                        <div className="product-price-range">
                          <div className="product-range-slider-range">
                            <Range
                              step={100}
                              min={MIN}
                              max={MAX}
                              values={price}
                              onChange={handlePriceRange}
                              renderTrack={({ props, children }) => (
                                <div
                                  {...props}
                                  style={{
                                    ...props.style,
                                    height: "3px",
                                    margin: "30px 10px",
                                    borderRadius: "5px",
                                    background: getTrackBackground({
                                      values: price,
                                      colors: ["#f5f5f5", "#9a7c47", "#f5f5f5"],
                                      min: MIN,
                                      max: MAX,
                                    }),
                                  }}
                                >
                                  {children}
                                </div>
                              )}
                              renderThumb={({ props }) => {
                                const { key, ...rest } = props;
                                return (
                                  <div
                                    key={key}
                                    {...rest}
                                    style={{
                                      ...props.style,
                                      height: "20px",
                                      width: "20px",
                                      backgroundColor: "#9a7c47",
                                      borderRadius: "50%",
                                      outline: "none",
                                    }}
                                  />
                                );
                              }}
                            />
                          </div>
                          <div className="price-range-input-wrap">
                            <div className="price-range-input">
                              <span>&#8377;</span>
                              {price[0]}
                            </div>
                            <p>to</p>
                            <div className="price-range-input">
                              <span>&#8377;</span>
                              {price[1]}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
                <div className={wrapClass("color")}>
                  <div
                    className="label"
                    onClick={() => toggleDropdown("color")}
                  >
                    Color
                  </div>
                  <div className="adi-select-menu">
                    <article>
                      <ul>
                        {colorData.map((item) => (
                          <li key={item.label.toLowerCase()}>
                            <input
                              type="checkbox"
                              name="category"
                              id={item.label.toLowerCase()}
                              checked={selectedColors.includes(item.label)}
                              onChange={() => toggleColor(item.label)}
                            />
                            <div className="in-bx"></div>
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>
                </div>
                {isMobile && (
                  <div className="btn-mbl-btm">
                    <button
                      className="btn solid-primary"
                      type="button"
                      onClick={closeModal}
                    >
                      Apply
                    </button>
                    <button
                      className="btn solid-black"
                      type="button"
                      onClick={closeModal}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              {isMobile && (
                <button type="button" className="close" onClick={closeModal}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 26 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.5 0.5L25.5 25.5M0.5 25.5L25.5 0.5"
                      stroke="black"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </button>
              )}
            </div>
            <div className="colC">
              <div className={wrapClass("sort", "sort_by slt-rgt")}>
                <div className="label" onClick={() => toggleDropdown("sort")}>
                  Sort By
                </div>
                <div className="adi-select-menu">
                  <article>
                    <ul>
                      {sortData.map((item) => (
                        <li key={item.label.toLowerCase()}>
                          <input
                            type="radio"
                            name="sort"
                            id={item.label.toLowerCase()}
                            checked={sortBy === item.label}
                            onChange={() => setSortBy(item.label)}
                          />
                          <div className="in-bx"></div>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="product_listing_wrapper">
        <div className="container">
          <div className="main_wrapper">
            {filteredProducts.slice(0, visibleCount).map((item: any) => (
              <ListingCard
                key={`${item.ProductID}-${item._color}`}
                data={item}
              />
            ))}
          </div>
          {filteredProducts.length > visibleCount && (
            <button
              type="button"
              className="load_more"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              <Image
                src="/icon/logo-vector.svg"
                width="43"
                height="30"
                alt="logo"
              ></Image>
              Load More..
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
