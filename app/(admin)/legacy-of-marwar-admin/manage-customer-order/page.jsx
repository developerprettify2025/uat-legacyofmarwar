"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useGetAllCustomerOrdersQuery,
  useUpdateCustomerOrderStatusMutation,
} from "../../../../store/backendSlice/customerOrderAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const currency = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const ORDER_STATUSES = [
  "Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled",
];
const PAYMENT_STATUSES = ["Pending", "Paid"];
const ORDER_STATUS_COLORS = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Packed: "#f97316",
  Shipped: "#0ea5e9",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? String(date)
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const isPaymentDone = (order) =>
      ["paid", "success", "completed"].includes(
        String(order.TransactionStatus || "").toLowerCase(),
      );

const escapeHtml = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);

export default function ManageCustomerOrderPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data: orderResponse, isLoading, isError } = useGetAllCustomerOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateCustomerOrderStatusMutation();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = fromDate || toDate ? new Date(`${fromDate || toDate}T00:00:00`) : new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const [expandedOrderID, setExpandedOrderID] = useState(undefined);

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    const paymentParam = new URLSearchParams(window.location.search).get("Payment");
    if (!paymentParam) return;

    const normalizedPayment = paymentParam.trim().toLowerCase();
    if (["paid", "done", "completed", "success"].includes(normalizedPayment)) {
      setPaymentFilter("paid");
    } else if (["unpaid", "pending", "not-paid", "not paid"].includes(normalizedPayment)) {
      setPaymentFilter("unpaid");
    }
  }, []);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.CanRead !== 1) {
      toast.error("You do not have permission to view orders.");
      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData, pagePermission, router]);

  const statuses = ORDER_STATUSES;
  const orders = Array.isArray(orderResponse?.data) ? orderResponse.data : [];
  const customers = useMemo(() => {
    const uniqueCustomers = new Map();
    orders.forEach((order) => {
      const customerId = Number(order.CustomerID);
      if (!customerId || uniqueCustomers.has(customerId)) return;
      uniqueCustomers.set(customerId, {
        CustomerID: customerId,
        CustomerName: order.CustomerName || `Customer #${customerId}`,
      });
    });
    return [...uniqueCustomers.values()].sort((a, b) =>
      a.CustomerName.localeCompare(b.CustomerName),
    );
  }, [orders]);

  const products = useMemo(() => {
    const uniqueProducts = new Map();
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const productId = String(item.ProductID ?? item.ProductCode ?? item.ProductName ?? "").trim();
        if (!productId || uniqueProducts.has(productId)) return;
        uniqueProducts.set(productId, {
          value: productId,
          label: item.ProductName || `Product #${productId}`,
        });
      });
    });
    return [...uniqueProducts.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchingSearch =
        !term ||
        [
          order.OrderNo,
          order.CustomerName,
          order.CustomerEmailID,
          order.CustomerPhoneNo,
          order.TransactionID,
          order.PaymentID,
          ...(order.items || []).flatMap((item) => [
            item.ProductName,
            item.ProductCode,
            item.ColorName,
          ]),
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchingStatus = !statusFilter || order.OrderStatus === statusFilter;
      const paid = isPaymentDone(order);
      const matchingPayment =
        !paymentFilter ||
        (paymentFilter === "paid" ? paid : !paid);
      const matchingCustomer =
        !customerFilter || Number(order.CustomerID) === Number(customerFilter);
      const matchingProduct =
        !productFilter ||
        (order.items || []).some((item) => {
          const productId = String(item.ProductID ?? item.ProductCode ?? item.ProductName ?? "").trim();
          return (
            productId === productFilter ||
            String(item.ProductName ?? "") === productFilter ||
            String(item.ProductCode ?? "") === productFilter
          );
        });
      const orderDate = String(order.OrderDate || "").slice(0, 10);
      const matchingFromDate = !fromDate || orderDate >= fromDate;
      const matchingToDate = !toDate || orderDate <= toDate;
      return (
        matchingSearch &&
        matchingStatus &&
        matchingPayment &&
        matchingCustomer &&
        matchingProduct &&
        matchingFromDate &&
        matchingToDate
      );
    });
  }, [orders, search, customerFilter, productFilter, statusFilter, paymentFilter, fromDate, toDate]);

  const paidCount = filteredOrders.filter(isPaymentDone).length;
  const unpaidCount = filteredOrders.length - paidCount;
  const paidAmount = filteredOrders.reduce(
    (sum, order) => sum + (isPaymentDone(order) ? Number(order.OrderTotalAmount || 0) : 0),
    0,
  );
  const unpaidAmount = filteredOrders.reduce(
    (sum, order) => sum + (!isPaymentDone(order) ? Number(order.OrderTotalAmount || 0) : 0),
    0,
  );
  const statusCounts = useMemo(
    () =>
      ORDER_STATUSES.reduce((counts, status) => {
        counts[status] = orders.filter((order) => order.OrderStatus === status).length;
        return counts;
      }, {}),
    [orders],
  );
  const getStatusColor = (status) => ORDER_STATUS_COLORS[status] || "#64748b";

  const formatDisplayDate = (value) => {
    if (!value) return "dd-mm-yyyy";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const getMonthGrid = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
      const dayNumber = index - startOffset + 1;
      const cellDate = new Date(year, month, dayNumber);
      const isCurrentMonth = cellDate.getMonth() === month;
      const isPrevMonth = cellDate.getMonth() < month;
      const isNextMonth = cellDate.getMonth() > month;
      const paddedDay = isPrevMonth
        ? prevMonthLastDay - startOffset + index + 1
        : isNextMonth
          ? index - (daysInMonth + startOffset) + 1
          : dayNumber;

      cells.push({
        key: `${year}-${month}-${dayNumber}`,
        date: cellDate,
        day: isPrevMonth || isNextMonth ? paddedDay : dayNumber,
        isCurrentMonth,
        isPrevMonth,
        isNextMonth,
      });
    }

    return cells;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDateKey = (date) => {
    const normalizedDate = new Date(`${date}T00:00:00`);
    return `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, "0")}-${String(normalizedDate.getDate()).padStart(2, "0")}`;
  };

  const handleDateSelection = (selectedDate) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(selectedDate);
      setToDate("");
      return;
    }

    if (selectedDate < fromDate) {
      setToDate(fromDate);
      setFromDate(selectedDate);
      setIsDatePickerOpen(false);
      return;
    }

    setToDate(selectedDate);
    setIsDatePickerOpen(false);
  };

  const renderDateRangePicker = () => {
    const firstMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const secondMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    const monthViews = [firstMonth, secondMonth];

    return (
      <div className={styles.datePickerPanel}>
        <div className={styles.datePickerHeader}>
          <button
            type="button"
            className={styles.datePickerNav}
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span>{monthNames[firstMonth.getMonth()]} {firstMonth.getFullYear()}</span>
          <span>{monthNames[secondMonth.getMonth()]} {secondMonth.getFullYear()}</span>
          <button
            type="button"
            className={styles.datePickerNav}
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className={styles.datePickerGridWrapper}>
          {monthViews.map((monthDate) => {
            const grid = getMonthGrid(monthDate);
            const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

            return (
              <div key={monthKey} className={styles.datePickerGridContainer}>
                <div className={styles.datePickerWeekdays}>
                  {weekdayLabels.map((day) => (
                    <span key={`${monthKey}-${day}`}>{day}</span>
                  ))}
                </div>
                <div className={styles.datePickerGrid}>
                  {grid.map((cell) => {
                    const cellKey = `${monthKey}-${cell.day}-${cell.isCurrentMonth ? "current" : cell.isPrevMonth ? "prev" : "next"}`;
                    const currentDateObj = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
                    const dateValue = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, "0")}-${String(currentDateObj.getDate()).padStart(2, "0")}`;
                    const selectedDateValue = fromDate && getDateKey(fromDate) === dateValue ? fromDate : "";
                    const inRange =
                      fromDate &&
                      toDate &&
                      dateValue >= fromDate &&
                      dateValue <= toDate;
                    const isSelected = dateValue === fromDate || dateValue === toDate;

                    return (
                      <button
                        key={cellKey}
                        type="button"
                        className={[
                          styles.dateCell,
                          !cell.isCurrentMonth ? styles.dateCellMuted : "",
                          isSelected ? styles.dateCellSelected : "",
                          inRange ? styles.dateCellRange : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => handleDateSelection(dateValue)}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrderTimeline = (status) => {
    const normalizedStatus = status || "Pending";

    if (normalizedStatus === "Cancelled") {
      return (
        <div className={styles.orderTimelineSingle}>
          <span className={styles.timelineLabel}>Cancelled</span>
          <span className={styles.timelineRail} aria-hidden="true">
            <span
              className={styles.timelineDot}
              style={{
                background: getStatusColor("Cancelled"),
                boxShadow: `0 0 0 4px ${getStatusColor("Cancelled")}22`,
              }}
            />
          </span>
        </div>
      );
    }

    const activeIndex = ORDER_STATUSES.indexOf(normalizedStatus);

    return (
      <div className={styles.orderTimeline}>
        {ORDER_STATUSES.filter((step) => step !== "Cancelled").map((step, index) => {
          const stepIndex = index;
          const isCompleted = stepIndex <= activeIndex;
          const isCurrent = step === normalizedStatus;
          const dotColor = isCompleted ? getStatusColor(step) : "#cbd5e1";

          return (
            <div key={`${step}-${index}`} className={styles.timelineStep}>
              <span className={styles.timelineLabel}>{step}</span>
              <span className={styles.timelineRail} aria-hidden="true">
                <span
                  className={styles.timelineRailFill}
                  style={{
                    background: isCompleted ? getStatusColor(step) : "transparent",
                    width: isCurrent ? "100%" : "100%",
                  }}
                />
                <span
                  className={styles.timelineDot}
                  style={{
                    background: dotColor,
                    boxShadow: isCompleted ? `0 0 0 4px ${dotColor}22` : "0 0 0 2px rgba(148,163,184,0.15)",
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    setExpandedOrderID((currentID) => {
      if (filteredOrders.some((order) => order.CustomerOrderListID === currentID)) {
        return currentID;
      }
      return filteredOrders[0]?.CustomerOrderListID ?? null;
    });
  }, [filteredOrders]);

  const exportOrders = () => {
    const columns = [
      "Order No.",
      "Order Date",
      "Customer",
      "Email",
      "Phone",
      "Products",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Transaction ID",
      "Shipping Amount",
      "GST Amount",
      "Discount",
      "Total",
    ];
    const rows = filteredOrders.map((order) => [
      order.OrderNo,
      formatDate(order.OrderDate),
      order.CustomerName,
      order.CustomerEmailID,
      order.CustomerPhoneNo,
      (order.items || [])
        .map((item) => `${item.ProductName} (${item.ColorName || "Default"}) x${item.ProductQuantity}`)
        .join("; "),
      order.OrderStatus,
      isPaymentDone(order) ? "Paid" : "Not Paid",
      order.PaymentOption,
      order.TransactionID,
      order.TotalShippingAmount,
      order.TotalGSTAmount,
      Number(order.CouponValue || 0) + Number(order.TotalUseEarnDiscount || 0),
      order.OrderTotalAmount,
    ]);
    const csv = [columns, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
            return `"${safeText.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");
    const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customer-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const createInvoice = (order) => {
    if (!isPaymentDone(order)) {
      toast.error("Invoice is available after payment is completed.");
      return;
    }
    const invoiceWindow = window.open("", "_blank", "width=900,height=900");
    if (!invoiceWindow) {
      toast.error("Allow pop-ups to print the invoice.");
      return;
    }
    const itemRows = (order.items || []).map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.ProductName)}<br><small>Color: ${escapeHtml(item.ColorName || "Default")}</small></td>
        <td>${Number(item.ProductQuantity || 0)}</td>
        <td>${currency(item.ProductSalePrice)}</td>
        <td>${currency(item.ProductTotalAmount)}</td>
      </tr>`).join("");
    const address = [
      order.OrderShippingAddressFullAddress,
      order.OrderShippingAddressLocality,
      order.OrderShippingAddressCity,
      order.OrderShippingAddressState,
      order.OrderShippingAddressPinCode,
    ].filter(Boolean).map(escapeHtml).join(", ");
    invoiceWindow.document.write(`<!doctype html>
      <html><head><title>Invoice ${escapeHtml(order.OrderNo)}</title>
      <meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#1f2937;margin:36px}
      h1{margin:0;color:#153349}header{display:flex;justify-content:space-between;border-bottom:2px solid #153349;padding-bottom:18px}
      .meta{margin:24px 0;display:flex;justify-content:space-between;gap:30px}
      .box{width:50%;line-height:1.6}.label{color:#64748b;font-size:12px;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:11px;border-bottom:1px solid #e2e8f0}
      th{background:#f1f5f9}td:last-child,th:last-child{text-align:right}.totals{width:300px;margin:20px 0 0 auto}
      .total{font-size:18px;font-weight:bold;border-top:2px solid #153349;padding-top:12px}
      small{color:#64748b}.paid{color:#15803d;font-weight:bold}
      @media print{body{margin:18mm}button{display:none}}
      </style></head><body>
      <header><div><h1>INVOICE</h1><p>Order #${escapeHtml(order.OrderNo)}</p></div>
      <div><b>Invoice Date:</b> ${escapeHtml(formatDate(order.OrderDate))}<br><b>Payment:</b> <span class="paid">PAID</span></div></header>
      <section class="meta"><div class="box"><div class="label">Bill To</div><b>${escapeHtml(order.CustomerName)}</b><br>
      ${escapeHtml(order.CustomerEmailID)}<br>${escapeHtml(order.CustomerPhoneNo)}</div>
      <div class="box"><div class="label">Ship To</div><b>${escapeHtml(order.OrderShippingAddressName)}</b><br>
      ${escapeHtml(order.OrderShippingAddressPhoneNo)}<br>${escapeHtml(order.OrderShippingAddressEmailID)}<br>${address}</div></section>
      <div><b>Payment method:</b> ${escapeHtml(order.PaymentOption || "Admin")} &nbsp; <b>Transaction ID:</b> ${escapeHtml(order.TransactionID || "-")}</div>
      <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${itemRows || "<tr><td colspan='5'>No line items</td></tr>"}</tbody></table>
      <div class="totals">
      <p>GST: ${currency(order.TotalGSTAmount)}</p><p>Shipping: ${currency(order.TotalShippingAmount)}</p>
      <p>Discount: ${currency(Number(order.CouponValue || 0) + Number(order.TotalUseEarnDiscount || 0))}</p>
      <p class="total">Total: ${currency(order.OrderTotalAmount)}</p></div>
      <p style="margin-top:48px;text-align:center;color:#64748b">Thank you for your purchase.</p>
      <script>window.onload=()=>window.print();</script></body></html>`);
    invoiceWindow.document.close();
  };

  const handleStatusChange = async (order, changes) => {
    if (pagePermission.CanWrite !== 1) {
      toast.error("You do not have permission to update orders.");
      return;
    }
    try {
      const result = await updateStatus({
        OrderNo: order.OrderNo,
        OrderStatus: changes.OrderStatus || order.OrderStatus,
        TransactionStatus: changes.TransactionStatus || order.TransactionStatus || "Pending",
        UpdatedBy: checkData?.user?.UserName || checkData?.user?.Name || "Admin Panel",
      }).unwrap();
      toast.success(
        result.TransactionID && changes.TransactionStatus === "Paid"
          ? `${result.message} Transaction ID: ${result.TransactionID}`
          : result.message || "Order updated.",
      );
    } catch (error) {
      toast.error(error?.data?.message || "Could not update order.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.paymentSummary}>
          <div className={styles.summaryCard}>
            <strong>{orders.length}</strong>
            <span>Total Orders</span>
          </div>
          <div className={styles.summaryCard}>
            <strong>{paidCount}</strong>
            <span>Payment Done · {currency(paidAmount)}</span>
          </div>
          <div className={styles.summaryCard}>
            <strong>{unpaidCount}</strong>
            <span>Payment Not Done · {currency(unpaidAmount)}</span>
          </div>
        </div>
        <div className={styles.heading}>
          <div>
            <h1>Manage Order List Data</h1>
            <p>Showing {filteredOrders.length} of {orders.length} orders · {paidCount} paid · {unpaidCount} not paid</p>
          </div>
          <div className={styles.headingActions}>
            <button
              className={styles.exportButton}
              type="button"
              onClick={exportOrders}
              disabled={!filteredOrders.length}
            >
              Export To Excel
            </button>
            {pagePermission.CanAdd === 1 && (
              <Link
                className={styles.addButton}
                href="/legacy-of-marwar-admin/addupd-customer-order"
              >
                Add Order
              </Link>
            )}
          </div>
        </div>
        <div className={styles.statusStrip}>
          {ORDER_STATUSES.map((status) => (
            <div
              key={status}
              className={styles.statusStripItem}
              style={{
                background: `${getStatusColor(status)}14`,
                borderColor: `${getStatusColor(status)}66`,
              }}
            >
              <span className={styles.statusDot} style={{ background: getStatusColor(status) }} />
              <span className={styles.statusLabel}>{status}</span>
              <strong>{statusCounts[status] ?? 0}</strong>
            </div>
          ))}
        </div>
        <div className={styles.toolbar}>
          <div className={styles.dateRangeWrapper}>
            <button
              type="button"
              className={styles.dateRangeTrigger}
              onClick={() => setIsDatePickerOpen((open) => !open)}
              aria-expanded={isDatePickerOpen}
              aria-label="Open date range picker"
            >
              <span className={styles.dateRangeField}>
                <span className={styles.dateRangeLabel}>From</span>
                <span>{formatDisplayDate(fromDate)}</span>
              </span>
              <span className={styles.dateRangeSeparator}>-</span>
              <span className={styles.dateRangeField}>
                <span className={styles.dateRangeLabel}>To</span>
                <span>{formatDisplayDate(toDate)}</span>
              </span>
            </button>
            {isDatePickerOpen && (
              <div className={styles.datePickerPopover}>
                {renderDateRangePicker()}
              </div>
            )}
          </div>
          <select
            aria-label="Filter by customer"
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
          >
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.CustomerID} value={customer.CustomerID}>
                {customer.CustomerName}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by product"
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.value} value={product.value}>
                {product.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by order status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All order statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select
            aria-label="Filter by payment status"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="">All payment statuses</option>
            <option value="paid">Payment Done</option>
            <option value="unpaid">Payment Not Done</option>
          </select>
          <input
            type="search"
            aria-label="Search orders"
            placeholder="Search order, customer, or product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className={styles.clearButton}
            type="button"
            onClick={() => {
              setCustomerFilter("");
              setProductFilter("");
              setStatusFilter("");
              setPaymentFilter("");
              setSearch("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear Filters
          </button>
        </div>
        {isError ? (
          <p className={styles.error}>Unable to load orders. Please refresh and try again.</p>
        ) : (
          <div className={styles.orderList}>
            {isLoading ? (
              <p className={styles.empty}>Loading orders...</p>
            ) : filteredOrders.length ? (
              filteredOrders.map((order) => (
                <article
                  className={styles.orderCard}
                  key={order.CustomerOrderListID}
                  style={{ borderLeft: `4px solid ${getStatusColor(order.OrderStatus)}` }}
                >
                  <div className={styles.orderTitle}>
                    <button
                      className={styles.orderToggle}
                      type="button"
                      aria-expanded={expandedOrderID === order.CustomerOrderListID}
                      aria-controls={`order-details-${order.CustomerOrderListID}`}
                      onClick={() =>
                        setExpandedOrderID((currentID) =>
                          currentID === order.CustomerOrderListID
                            ? null
                            : order.CustomerOrderListID,
                        )
                      }
                    >
                      <span>
                        <span className={styles.orderNumber}>Order No.- {order.OrderNo}</span>
                        <span>Order on {formatDate(order.OrderDate)}</span>
                      </span>
                      <span className={styles.orderPreview}>
                        {order.CustomerName || `Customer #${order.CustomerID}`} ·{" "}
                        {currency(order.OrderTotalAmount)} · {order.OrderStatus}
                      </span>
                      <span
                        className={`${styles.chevron} ${
                          expandedOrderID === order.CustomerOrderListID
                            ? styles.chevronExpanded
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      className={styles.invoiceButton}
                      type="button"
                      disabled={!isPaymentDone(order)}
                      title={isPaymentDone(order) ? "Print invoice" : "Available after payment is done"}
                      onClick={() => createInvoice(order)}
                    >
                      {isPaymentDone(order) ? "Create Invoice" : "Invoice After Payment"}
                    </button>
                  </div>
                  {expandedOrderID === order.CustomerOrderListID && (
                    <div id={`order-details-${order.CustomerOrderListID}`}>
                  <div className={styles.orderTimelineWrap}>{renderOrderTimeline(order.OrderStatus)}</div>
                  <div className={styles.customerSummary}>
                    <span className={styles.avatar}>
                      {(order.CustomerName || "C").trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{order.CustomerName || `Customer #${order.CustomerID}`}</strong>
                      <span><b>Email:</b> {order.CustomerEmailID || "-"}</span>
                      <span><b>Mobile:</b> {order.CustomerPhoneNo || "-"}</span>
                      <span className={styles.deliveryAddress}>
                        <b>Delivery Address:</b>{" "}
                        {[
                          order.OrderShippingAddressFullAddress,
                          order.OrderShippingAddressLocality,
                          order.OrderShippingAddressCity,
                          order.OrderShippingAddressState,
                          order.OrderShippingAddressPinCode,
                        ].filter(Boolean).join(", ") || "Address unavailable"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.detailsGrid}>
                    <section className={styles.productSection}>
                      <h3>Product Detail</h3>
                      {(order.items || []).map((item, index) => (
                        <div className={styles.productRow} key={`${item.ProductID}-${index}`}>
                          <div className={styles.productImage}>
                            {item.ProductImage && (
                              <img
                                src={`/OnlineImages/ProductImages/${encodeURIComponent(item.ProductImage)}`}
                                alt=""
                              />
                            )}
                          </div>
                          <div className={styles.productInfo}>
                            <strong>{item.ProductName}</strong>
                            <span>Color: {item.ColorName || "Default"}</span>
                            <span>Price: {item.ProductQuantity} × {currency(item.ProductSalePrice)}</span>
                            <b>{currency(item.ProductTotalAmount)}</b>
                          </div>
                        </div>
                      ))}
                    </section>
                    <section className={styles.shippingSection}>
                      <h3>Shipping Address</h3>
                      <div className={styles.shippingCard}>
                        <strong>{order.OrderShippingAddressName || "Address unavailable"}</strong>
                        <span>
                          {order.OrderShippingAddressPhoneNo}{" "}
                          {order.OrderShippingAddressEmailID
                            ? `| ${order.OrderShippingAddressEmailID}`
                            : ""}
                        </span>
                        <span>
                          {[
                            order.OrderShippingAddressFullAddress,
                            order.OrderShippingAddressLocality,
                            order.OrderShippingAddressCity,
                            order.OrderShippingAddressState,
                            order.OrderShippingAddressPinCode,
                          ].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    </section>
                  </div>
                  <div className={styles.orderFooter}>
                    <div className={styles.paymentInfo}>
                      <span>Payment<strong>{order.PaymentOption || "Admin"}</strong></span>
                      <span>Transaction ID<strong>{order.TransactionID || "-"}</strong></span>
                      <span>Payment Status<strong>{isPaymentDone(order) ? "Paid" : "Not Paid"}</strong></span>
                      <span>Shipping<strong>{currency(order.TotalShippingAmount)}</strong></span>
                    </div>
                    <div className={styles.statusControls}>
                      <label>
                        <span className={styles.srOnly}>Order status for order {order.OrderNo}</span>
                        <select
                          value={order.OrderStatus}
                          disabled={isUpdating || pagePermission.CanWrite !== 1}
                          onChange={(event) =>
                            handleStatusChange(order, { OrderStatus: event.target.value })
                          }
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className={styles.srOnly}>Payment status for order {order.OrderNo}</span>
                        <select
                          value={isPaymentDone(order) ? "Paid" : "Pending"}
                          disabled={isUpdating || pagePermission.CanWrite !== 1}
                          onChange={(event) =>
                            handleStatusChange(order, { TransactionStatus: event.target.value })
                          }
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <div className={styles.totalPrice}>
                        <span>Total Price</span>
                        <strong>{currency(order.OrderTotalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className={styles.empty}>No orders found.</p>
            )}
          </div>
        )}
        <p className={styles.count}>Showing {filteredOrders.length} of {orders.length} entries</p>
      </section>
    </main>
  );
}
