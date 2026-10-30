
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Select from "../../atoms/Select";
//import DateRangeFilter from "./DateRangeFilter";

interface StatusOptions {
  label: string;
  value: string;
}

interface OrderItem {
  ProductID: number;
  ProductName: string;
  ProductQuantity: number;
  ProductSalePrice: number;
  ProductTotalAmount: number;
  ProductImage?: string;
}

interface Order {
  CustomerOrderListID: number;
  OrderNo: number;
  OrderDate: string;
  OrderTotalAmount: number;
  TransactionID: string | null;
  TransactionStatus: string;
  OrderStatus: string;
  DeliveryDate: string | null;
  items: OrderItem[];
}

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  isError?: boolean;
}

const statusOptions: StatusOptions[] = [
  { label: "Pending", value: "Pending" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Processing", value: "Processing" },
  { label: "Packed", value: "Packed" },
  { label: "Shipped", value: "Shipped" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

export default function OrderList({
  orders = [],
  isLoading = false,
  isError = false,
}: OrderListProps) {
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredOrders = useMemo(() => {
    return (orders ?? []).filter((order) => {
      const matchesStatus =
        !status || order.OrderStatus === status;

      const orderDate = order.OrderDate
        ? new Date(order.OrderDate)
        : null;

      const validOrderDate =
        orderDate !== null &&
        !Number.isNaN(orderDate.getTime());

      const matchesStartDate =
        !startDate ||
        (validOrderDate &&
          orderDate! >= new Date(`${startDate}T00:00:00`));

      const matchesEndDate =
        !endDate ||
        (validOrderDate &&
          orderDate! <= new Date(`${endDate}T23:59:59.999`));

      return (
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [orders, status, startDate, endDate]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "N/A";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatPrice = (value: number | string | null | undefined) =>
    `INR ${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <div className="aside-right order-right">
      <div className="aside-right-wrap">
        <div className="title order_title">
          <h3 className="form-title">My Orders</h3>

          <div className="filter_options">
            {/* <p>Filter by</p>

            <div className="form flex">
              <Select
                classname="status_list"
                label="Status"
                name="status"
                id="status"
                options={statusOptions}
                value={status}
                onChange={(value: string) => setStatus(value)}
              />

              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onChange={(start: string, end: string) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            </div> */}
          </div>
        </div>

        <div className="order_list">
          {isLoading ? (
            <p>Loading orders...</p>
          ) : isError ? (
            <p>Unable to load orders. Please try again.</p>
          ) : filteredOrders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                className="order_item"
                key={order.CustomerOrderListID}
              >
                <div className="order_id">
                  <p
                    className={`${
                      order.OrderStatus === "Delivered"
                        ? "light-green "
                        : ""
                    }id`}
                  >
                    {order.OrderNo}
                  </p>

                  <p>
                    {order.DeliveryDate ? `Deliver on ${formatDate(order.DeliveryDate)}` : `Order date: ${formatDate(order.OrderDate)}`}
                  </p>
                </div>

                <div className="order_content">
                  <div className="upper_content">
                    <div className="order_name">
                      <p className="name">
                        {order.items?.length
                          ? order.items
                              .map((item) => item.ProductName)
                              .join(", ")
                          : "Order items"}
                      </p>

                      <p className="price">
                        {formatPrice(order.OrderTotalAmount)}
                      </p>
                    </div>

                    <div className="btn_wrap">
                      <Link
                        href={`/my-order-detail?orderNo=${order.OrderNo}`}
                        className="btn secondary-border"
                      >
                        <span className="sm-none">
                          Download Invoice
                        </span>
                        <span className="sm-block">
                          Invoice
                        </span>
                      </Link>

                      <Link
                        href={`/my-order-detail?orderNo=${order.OrderNo}`}
                        className="btn secondary-border"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="trans_details">
                    <p>
                      Txn ID :{" "}
                      <span>{order.TransactionID || "N/A"}</span>
                    </p>

                    <p>
                      Status :{" "}
                      <span>{order.OrderStatus || "Pending"}</span>
                    </p>

                    {/* <p>
                      Order Date :{" "}
                      <span>{formatDate(order.OrderDate)}</span>
                    </p> */}

                    <p className="total_price">
                      Total Price :{" "}
                      <span>{formatPrice(order.OrderTotalAmount)}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
