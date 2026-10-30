"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { useGetAdminDashboardQuery } from "@/store/backendSlice/reportSummaryAPISlice";
import { useLogoutMutation, authAPISlice, useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import { useGetAllCustomerOrdersQuery } from "@/store/backendSlice/customerOrderAPISlice";
import { useGetAllCustomersQuery } from "@/store/backendSlice/customerAPISlice";
import { useGetAllProductsQuery } from "@/store/backendSlice/productAPISlice";
import { usePagePermission } from "../usePagePermission";
import { useState, useMemo, useEffect } from "react";
import styles from "./page.module.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const STBG_TEAL = "#1c2f63";
const STBG_ORANGE = "#065e87";
const REPORT_PERIODS = [
  { id: "daily", label: "Monthly · Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "halfYearly", label: "Half-yearly" },
  { id: "yearly", label: "Yearly" },
  { id: "all", label: "All data" },
];

const getOrderDateKey = (order) => {
  const dateValue = String(order.OrderDate || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : "";
};

const formatOrderDate = (dateValue) => {
  const dateKey = getOrderDateKey({ OrderDate: dateValue });
  if (!dateKey) return "Date unavailable";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Icons = {
  Base: ({ style }) => (
    <svg style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14H12V22L22 10H13V2Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const MiniCard = ({ label, value, color, bg, link = "#" }) => (
  <Link href={link} className={styles.statCard}>
    <span className={styles.statIcon} style={{ color, backgroundColor: bg }}>
      <Icons.Base />
    </span>
    <span className={styles.statValue}>{value?.toLocaleString() || 0}</span>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statArrow} aria-hidden="true">↗</span>
  </Link>
);

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: checkData, isSuccess: isAuthCheckSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 180000,
    skipPollingIfUnfocused: true,
  });

  const pagePermission = usePagePermission(checkData);
  const isPermissionsReady = isAuthCheckSuccess && checkData?.loggedIn && pagePermission?.PageID !== 0;

  const isAdmin = (checkData?.user?.loginID || checkData?.user?.[0]?.loginID) === 1 || checkData?.user?.Role === "Super Admin";

  const { data: dashData, isLoading: dashLoading } = useGetAdminDashboardQuery();
  const { data: orderResponse, isLoading: ordersLoading, isError: ordersError } = useGetAllCustomerOrdersQuery();
  const { data: customerResponse, isLoading: customersLoading, isError: customersError } = useGetAllCustomersQuery();
  const { data: productResponse, isLoading: productsLoading, isError: productsError } = useGetAllProductsQuery();
  const [logout] = useLogoutMutation();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [expandedOrderDetails, setExpandedOrderDetails] = useState(null);

  useEffect(() => {
    if (isAuthCheckSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isAuthCheckSuccess, checkData, router]);

  useEffect(() => {
    if (!isPopupOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsPopupOpen(false);
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPopupOpen]);

  const p = dashData?.predictionCounts || {};
  const orders = Array.isArray(orderResponse?.data) ? orderResponse.data : [];
  const customers = Array.isArray(customerResponse?.data) ? customerResponse.data : [];
  const products = Array.isArray(productResponse) ? productResponse : [];
  const orderStats = useMemo(() => {
    const paidOrders = orders.filter((order) =>
      ["paid", "success", "completed"].includes(String(order.TransactionStatus || "").toLowerCase()),
    );
    return {
      total: orders.length,
      revenue: orders.reduce((sum, order) => sum + Number(order.OrderTotalAmount || 0), 0),
      paid: paidOrders.length,
      unpaid: orders.length - paidOrders.length,
      customers: customers.length,
      products: products.length,
    };
  }, [orders, customers, products]);

  const recentOrders = useMemo(
    () => [...orders]
      .sort((a, b) => {
        const dateComparison = getOrderDateKey(b).localeCompare(getOrderDateKey(a));
        return dateComparison || Number(b.OrderNo || 0) - Number(a.OrderNo || 0);
      })
      .slice(0, 8),
    [orders],
  );

  const bestSellers = useMemo(() => {
    const productSales = new Map();
    orders.forEach((order) => {
      if (String(order.OrderStatus || "").toLowerCase() === "cancelled") return;
      (order.items || []).forEach((item) => {
        const id = String(item.ProductID ?? item.ProductName ?? "").trim();
        if (!id) return;
        const current = productSales.get(id) || {
          id,
          name: item.ProductName || `Product #${id}`,
          quantity: 0,
          sales: 0,
        };
        current.quantity += Number(item.ProductQuantity || 0);
        current.sales += Number(item.ProductTotalAmount || 0);
        productSales.set(id, current);
      });
    });
    return [...productSales.values()]
      .sort((a, b) => b.quantity - a.quantity || b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  const orderReport = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const buckets = new Map();
    let labels = [];
    const toLocalDateKey = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (reportPeriod === "daily") {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
      labels.forEach((label) => buckets.set(
        `${year}-${String(month + 1).padStart(2, "0")}-${label.padStart(2, "0")}`,
        0,
      ));
      orders.forEach((order) => {
        const dateKey = getOrderDateKey(order);
        if (dateKey.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)) {
          buckets.set(dateKey, (buckets.get(dateKey) || 0) + 1);
        }
      });
    } else if (reportPeriod === "weekly") {
      labels = Array.from({ length: 12 }, (_, index) => `Week ${index + 1}`);
      const startOfCurrentWeek = new Date(year, month, now.getDate());
      startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - ((startOfCurrentWeek.getDay() + 6) % 7));
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      const weekStarts = labels.map((_, index) => {
        const start = new Date(startOfCurrentWeek);
        start.setDate(start.getDate() - ((11 - index) * 7));
        return start;
      });
      weekStarts.forEach((start) => buckets.set(toLocalDateKey(start), 0));
      orders.forEach((order) => {
        const dateKey = getOrderDateKey(order);
        if (!dateKey) return;
        const date = new Date(`${dateKey}T00:00:00`);
        const index = weekStarts.findIndex((start, weekIndex) => {
          const end = new Date(weekStarts[weekIndex + 1] || start);
          if (weekIndex === 11) end.setDate(end.getDate() + 7);
          return date >= start && date < end;
        });
        if (index >= 0) {
          const key = toLocalDateKey(weekStarts[index]);
          buckets.set(key, buckets.get(key) + 1);
        }
      });
    } else if (reportPeriod === "quarterly") {
      labels = ["Q1", "Q2", "Q3", "Q4"];
      labels.forEach((label) => buckets.set(label, 0));
      orders.forEach((order) => {
        const dateKey = getOrderDateKey(order);
        if (!dateKey || Number(dateKey.slice(0, 4)) !== year) return;
        const quarter = `Q${Math.floor((Number(dateKey.slice(5, 7)) - 1) / 3) + 1}`;
        buckets.set(quarter, buckets.get(quarter) + 1);
      });
    } else if (reportPeriod === "halfYearly") {
      labels = ["First half", "Second half"];
      labels.forEach((label) => buckets.set(label, 0));
      orders.forEach((order) => {
        const dateKey = getOrderDateKey(order);
        if (!dateKey || Number(dateKey.slice(0, 4)) !== year) return;
        const half = Number(dateKey.slice(5, 7)) <= 6 ? "First half" : "Second half";
        buckets.set(half, buckets.get(half) + 1);
      });
    } else if (reportPeriod === "yearly") {
      const availableYears = orders
        .map((order) => getOrderDateKey(order).slice(0, 4))
        .filter(Boolean)
        .sort();
      const firstYear = Math.max(Number(availableYears[0] || year), year - 9);
      const years = Array.from(
        { length: Math.max(1, year - firstYear + 1) },
        (_, index) => String(firstYear + index),
      );
      labels = years;
      years.forEach((value) => buckets.set(value, 0));
      orders.forEach((order) => {
        const orderYear = getOrderDateKey(order).slice(0, 4);
        if (buckets.has(orderYear)) buckets.set(orderYear, buckets.get(orderYear) + 1);
      });
    } else {
      const availableMonths = orders
        .map((order) => getOrderDateKey(order).slice(0, 7))
        .filter(Boolean)
        .sort();
      const firstMonth = availableMonths[0] || `${year}-${String(month + 1).padStart(2, "0")}`;
      const [firstYearNumber, firstMonthNumber] = firstMonth.split("-").map(Number);
      const months = [];
      const monthCursor = new Date(firstYearNumber, firstMonthNumber - 1, 1);
      const lastMonth = new Date(year, month, 1);
      while (monthCursor <= lastMonth) {
        months.push(`${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`);
        monthCursor.setMonth(monthCursor.getMonth() + 1);
      }
      labels = months.map((value) => {
        const [monthYear, monthNumber] = value.split("-").map(Number);
        return new Date(monthYear, monthNumber - 1, 1).toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
      });
      months.forEach((value) => buckets.set(value, 0));
      orders.forEach((order) => {
        const orderMonth = getOrderDateKey(order).slice(0, 7);
        if (buckets.has(orderMonth)) buckets.set(orderMonth, buckets.get(orderMonth) + 1);
      });
    }

    return {
      labels,
      values: [...buckets.values()],
      total: [...buckets.values()].reduce((sum, count) => sum + count, 0),
    };
  }, [orders, reportPeriod]);

  const handleLogout = async () => {
    try {
      const result = await logout(undefined).unwrap();
      if (result.success) {
        dispatch(authAPISlice.util.updateQueryData("checkLogin", undefined, (draft) => { draft.loggedIn = false; draft.user = null; }));
        router.push("/legacy-of-marwar-admin/login");
      }
    } catch (e) { console.error(e); }
  };

  const allStats = useMemo(() => [
    { label: "Categories", value: p.TotalCategory, color: STBG_ORANGE, bg: '#FFF3E0', link: "/legacy-of-marwar-admin/manage-category" },
    { label: "Total Products", value: productsLoading ? "..." : productsError ? "Unavailable" : orderStats.products, color: STBG_TEAL, bg: "#E0F2F2", link: "/legacy-of-marwar-admin/manage-product" },
    { label: "Total Blogs", value: p.TotalBlog, color: STBG_TEAL, bg: '#E0F2F2', big: true, link: "/legacy-of-marwar-admin/manage-blog" },
    // { label: "Static Pages", value: p.TotalStaticPage, color: STBG_TEAL, bg: '#E0F2F2', link: "/legacy-of-marwar-admin/manage-page" },
    { label: "Enquiries", value: p.TotalEnquiry, color: STBG_ORANGE, bg: '#FFF3E0', link: "/legacy-of-marwar-admin/manage-visitor-enquiry" },
    // { label: "Users / Access", value: p.TotalUser, color: STBG_TEAL, bg: '#E0F2F2', link: "/legacy-of-marwar-admin/manage-user" },
  ], [p]);
  const commerceStats = [
    { label: "Total Customers", value: customersLoading ? "..." : customersError ? "Unavailable" : orderStats.customers, color: STBG_ORANGE, bg: "#FFF3E0", link: "/legacy-of-marwar-admin/manage-customer" },
    { label: "Total Orders", value: ordersLoading ? "..." : ordersError ? "Unavailable" : orderStats.total, color: STBG_TEAL, bg: "#E0F2F2", link: "/legacy-of-marwar-admin/manage-customer-order" },
    { label: "Total Order Value", value: ordersLoading ? "..." : ordersError ? "Unavailable" : `₹${orderStats.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: STBG_ORANGE, bg: "#FFF3E0", link: "/legacy-of-marwar-admin/manage-customer-order" },
    { label: "Paid Orders", value: ordersLoading ? "..." : ordersError ? "Unavailable" : orderStats.paid, color: STBG_TEAL, bg: "#E0F2F2", link: "/legacy-of-marwar-admin/manage-customer-order?Payment=paid" },
    //{ label: "Payment Pending", value: ordersLoading ? "..." : ordersError ? "Unavailable" : orderStats.unpaid, color: STBG_ORANGE, bg: "#FFF3E0", link: "/legacy-of-marwar-admin/manage-customer-order" },
  ];

  const orderChartData = {
    labels: orderReport.labels,
    datasets: [{
      label: "Orders",
      data: orderReport.values,
      borderColor: STBG_TEAL,
      backgroundColor: "rgba(28, 47, 99, 0.08)",
      tension: 0.35,
      fill: true,
      borderWidth: 2,
      pointRadius: orderReport.labels.length > 35 ? 0 : 2,
    }],
  };

  if (dashLoading) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} />
    </div>
  );

  const WelcomeBanner = () => (
    <section className={styles.welcome}>
      <div className={styles.welcomeContent}>
        <span className={styles.welcomeEyebrow}>Legacy Of Marwar ADMIN</span>
        <h1 className={styles.welcomeTitle}>
          Welcome to the Legacy Of Marwar Admin Dashboard
        </h1>
        <p className={styles.welcomeText}>
          Manage your website content, team, and visitor enquiries from one place.
        </p>
        <div className={styles.welcomeActions}>
          <Link href="/" target="_blank" rel="noreferrer" className={styles.websiteButton}>
            View Website
          </Link>
          <button type="button" onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </div>
      <div className={styles.welcomeArtwork}>
        <img
          src="/OnlineImages/assets/man-with-laptop-light.png"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
          alt="Illustration"
        />
      </div>
    </section>
  );

  return (
    <main className={styles.dashboard}>
      <WelcomeBanner />
      <section className={styles.statsGrid} aria-label="Store summary">
        {commerceStats.map((stat) => <MiniCard key={stat.label} {...stat} />)}
      </section>
      {(ordersError || customersError || productsError) && (
        <p className={styles.dataError}>
          {[
            ordersError && "orders",
            customersError && "customers",
            productsError && "products",
          ].filter(Boolean).join(", ")} data could not be loaded. Please refresh to retry.
        </p>
      )}
      <section className={styles.insightsGrid} aria-label="Order insights">
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>ORDER OVERVIEW · {new Date().getFullYear()}</span>
              <h2 className={styles.panelTitle}>Order Report</h2>
            </div>
            <div className={styles.totalEnquiries}>
              <span>{ordersLoading ? "..." : orderReport.total.toLocaleString()}</span>
              <small>Orders in view</small>
            </div>
          </div>
          <div className={styles.reportControls} role="group" aria-label="Order report period">
            {REPORT_PERIODS.map((period) => (
              <button
                key={period.id}
                type="button"
                className={`${styles.reportPeriod} ${reportPeriod === period.id ? styles.reportPeriodActive : ""}`}
                aria-pressed={reportPeriod === period.id}
                onClick={() => setReportPeriod(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className={styles.chartWrap}>
            {ordersError ? (
              <p className={styles.emptyState}>Unable to load order report.</p>
            ) : (
              <Line data={orderChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", maxTicksLimit: 14, autoSkip: true },
                  },
                  y: {
                    grid: { color: "#edf1f6", borderDash: [5, 5] },
                    beginAtZero: true,
                    ticks: { color: "#94a3b8", precision: 0 },
                  },
                },
              }} />
            )}
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>LATEST ACTIVITY</span>
              <h2 className={styles.panelTitle}>Recent Orders</h2>
            </div>
            <Link href="/legacy-of-marwar-admin/manage-customer-order" className={styles.viewAll}>
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.enquiryList}>
            {ordersError ? (
              <p className={styles.emptyState}>Unable to load recent orders.</p>
            ) : recentOrders.length ? (
              recentOrders.map((order) => (
                <div key={order.CustomerOrderListID} className={styles.orderActivity}>
                  <button
                    type="button"
                    className={styles.orderActivityButton}
                    aria-expanded={expandedOrderDetails === order.CustomerOrderListID}
                    aria-controls={`dashboard-order-${order.CustomerOrderListID}`}
                    onClick={() => setExpandedOrderDetails((current) =>
                      current === order.CustomerOrderListID ? null : order.CustomerOrderListID,
                    )}
                  >
                    <span className={styles.orderActivityIdentity}>
                      <strong>Order #{order.OrderNo}</strong>
                      <span>{order.CustomerName || `Customer #${order.CustomerID}`}</span>
                      <small>{formatOrderDate(order.OrderDate)}</small>
                    </span>
                    <span className={styles.orderActivityAmount}>
                      <strong>₹{Number(order.OrderTotalAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                      <span>{order.OrderStatus || "Pending"}</span>
                    </span>
                    <span className={styles.orderActivityChevron} aria-hidden="true">
                      {expandedOrderDetails === order.CustomerOrderListID ? "−" : "+"}
                    </span>
                  </button>
                  {expandedOrderDetails === order.CustomerOrderListID && (
                    <div
                      className={styles.orderDetails}
                      id={`dashboard-order-${order.CustomerOrderListID}`}
                    >
                      <div className={styles.orderDetailsCustomer}>
                        <strong>{order.CustomerName || `Customer #${order.CustomerID}`}</strong>
                        <span>{order.CustomerEmailID || "Email unavailable"}</span>
                        <span>{order.CustomerPhoneNo || "Phone unavailable"}</span>
                      </div>
                      <div className={styles.orderDetailsProducts}>
                        <strong>Products</strong>
                        {(order.items || []).length ? order.items.map((item, index) => (
                          <div className={styles.orderDetailsProduct} key={`${item.ProductID}-${index}`}>
                            <span>{item.ProductName || `Product #${item.ProductID}`} × {Number(item.ProductQuantity || 0)}</span>
                            <strong>₹{Number(item.ProductTotalAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                          </div>
                        )) : <span>No product details available.</span>}
                      </div>
                      <div className={styles.orderDetailsMeta}>
                        <span>Payment: <strong>{order.PaymentOption || "Admin"}</strong></span>
                        <span>Payment status: <strong>{order.TransactionStatus || "Pending"}</strong></span>
                        <span>Transaction ID: <strong>{order.TransactionID || "-"}</strong></span>
                        <span>Shipping: <strong>₹{Number(order.TotalShippingAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></span>
                      </div>
                      <div className={styles.orderDetailsAddress}>
                        <strong>Shipping address</strong>
                        <span>{order.OrderShippingAddressName || order.CustomerName || "Address unavailable"}</span>
                        <span>{[
                          order.OrderShippingAddressFullAddress,
                          order.OrderShippingAddressLocality,
                          order.OrderShippingAddressCity,
                          order.OrderShippingAddressState,
                          order.OrderShippingAddressPinCode,
                        ].filter(Boolean).join(", ") || "Address unavailable"}</span>
                      </div>
                      <Link
                        href="/legacy-of-marwar-admin/manage-customer-order"
                        className={styles.orderDetailsLink}
                      >
                        Manage order
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>{ordersLoading ? "Loading orders..." : "No recent orders found."}</p>
            )}
          </div>
        </div>
      </section>      
      <section className={styles.statsGrid} aria-label="Content summary">
        {allStats.map((stat) => <MiniCard key={stat.label} {...stat} />)}
      </section>
      <section className={styles.insightsGrid} aria-label="Sales and enquiry insights">
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>TOP PRODUCTS</span>
              <h2 className={styles.panelTitle}>Bestselling Products</h2>
            </div>
            <Link href="/legacy-of-marwar-admin/manage-product" className={styles.viewAll}>
              Products <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.enquiryList}>
            {ordersError ? (
              <p className={styles.emptyState}>Unable to load bestseller data.</p>
            ) : bestSellers.length ? (
              bestSellers.map((product, index) => (
                <div key={product.id} className={styles.bestSellerItem}>
                  <span className={styles.bestSellerRank}>{index + 1}</span>
                  <div className={styles.bestSellerInfo}>
                    <strong>{product.name}</strong>
                    <span>{product.quantity.toLocaleString()} sold</span>
                  </div>
                  <strong className={styles.bestSellerRevenue}>
                    ₹{product.sales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </strong>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>{ordersLoading ? "Loading products..." : "No bestseller data yet."}</p>
            )}
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>LATEST ACTIVITY</span>
              <h2 className={styles.panelTitle}>Recent Enquiries</h2>
            </div>
            <Link href="/legacy-of-marwar-admin/manage-visitor-enquiry" className={styles.viewAll}>
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.enquiryList}>
            {dashData?.recentEnquiries?.length > 0 ? (
              dashData.recentEnquiries.map((item, i) => (
                <div key={item.ContactID || `${item.EmailID}-${i}`} className={styles.enquiryItem}>
                  <div className={styles.enquiryIdentity}>
                    <div className={styles.avatar}>
                      {(item.FullName || "U").split(" ").map((name) => name[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.enquiryInfo}>
                      <div className={styles.enquiryName}>{item.FullName || "Visitor"}</div>
                      <div className={styles.enquiryMeta}>
                        {item.EnquiryType && <span className={styles.enquiryType}>{item.EnquiryType}</span>}
                        <span>{item.FormattedDate || item.PostedDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(item); setIsPopupOpen(true); }}
                    className={styles.viewButton}
                    aria-label={`View enquiry from ${item.FullName || "visitor"}`}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>No recent enquiries found</p>
            )}
          </div>
        </div>
      </section>
      {isPopupOpen && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => { setIsPopupOpen(false); setSelectedUser(null); }} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="enquiry-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeading}>
              <div>
                <span className={styles.panelEyebrow}>VISITOR ENQUIRY</span>
                <h2 className={styles.modalTitle} id="enquiry-modal-title">Enquiry Details</h2>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Close enquiry details" onClick={() => { setIsPopupOpen(false); setSelectedUser(null); }}>×</button>
            </div>
            <div className={styles.detailsGrid}>
              <div>
                <p className={styles.detailLabel}>FULL NAME</p>
                <p className={styles.detailValue}>{selectedUser.FullName || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>EMAIL ADDRESS</p>
                <p className={styles.detailValue}>{selectedUser.EmailID || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>PHONE NUMBER</p>
                <p className={styles.detailValue}>{selectedUser.PhoneNo || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>COUNTRY</p>
                <p className={styles.detailValue}>{selectedUser.CountryName || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>ENQUIRY FOR</p>
                <p className={styles.detailValue}>{selectedUser.EnquiryFor || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>TYPE</p>
                <p className={styles.detailValue}>{selectedUser.EnquiryType || 'N/A'}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>POSTED DATE</p>
                <p className={styles.detailValue}>{selectedUser.FormattedDate || selectedUser.PostedDate || 'N/A'}</p>
              </div>
              <div className={styles.wideDetail}>
                <p className={styles.detailLabel}>PAGE URL</p>
                <p className={styles.detailValue}>{selectedUser.PageName || '/'}</p>
              </div>
              <div className={`${styles.wideDetail} ${styles.messageDetail}`}>
                <p className={styles.detailLabel}>MESSAGE</p>
                <div className={styles.messageBody}>
                  {selectedUser.Message || 'No message provided.'}
                </div>
              </div>
            </div>
            <button type="button" className={styles.modalDone} onClick={() => { setIsPopupOpen(false); setSelectedUser(null); }}>
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
