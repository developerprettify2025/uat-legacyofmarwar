const axios = require("axios");

const SHIPROCKET_AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const SHIPROCKET_CREATE_ORDER_URL = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc";
const SHIPROCKET_ORDERS_URL = "https://apiv2.shiprocket.in/v1/external/orders";
const SHIPROCKET_TRACK_URL = "https://apiv2.shiprocket.in/v1/external/courier/track";

const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL || "developer@legacyofmarwar.com",
  password: process.env.SHIPROCKET_PASSWORD || "ewa67v8RR*O^r**st6myK8$HGOuY#&hD",
  pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
  seller_name: "Legacy of Marwar",
  warehouse_address: "F 5/3 , 3rd Floor, DLF Phase 1, Arjun Market",
  city: "Gurgaon",
  state: "Haryana",
  pincode: "122002",
  country: "India",
  spoc_name: "Trishla Tekriwal",
  spoc_phone: "9811887651",
  spoc_email: "developer@legacyofmarwar.com",
};

let cachedToken = null;
let tokenExpiresAt = null;

// Circuit breaker: after a failed auth, wait 30 min before retrying
let authFailedAt = null;
const AUTH_BACKOFF_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Obtain JWT token from Shiprocket with in-memory caching + circuit breaker.
 * If the last auth attempt failed, we won't retry for AUTH_BACKOFF_MS ms
 * to avoid hammering the API and triggering account lockout.
 */
async function getShiprocketToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  // Circuit breaker: bail out early if we recently failed
  if (authFailedAt && Date.now() - authFailedAt < AUTH_BACKOFF_MS) {
    const waitMin = Math.ceil((AUTH_BACKOFF_MS - (Date.now() - authFailedAt)) / 60000);
    throw new Error(
      `Shiprocket auth is in cooldown after a failed attempt. Retry in ~${waitMin} minute(s).`
    );
  }
  try {
    const response = await axios.post(
      SHIPROCKET_AUTH_URL,
      {
        email: SHIPROCKET_CONFIG.email,
        password: SHIPROCKET_CONFIG.password,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );
    const token = response.data?.token;
    if (!token) {
      throw new Error("Shiprocket authentication failed: No token received");
    }
    cachedToken = token;
    tokenExpiresAt = Date.now() + 8 * 24 * 60 * 60 * 1000;
    authFailedAt = null; // reset circuit breaker on success
    return cachedToken;
  } catch (error) {
    authFailedAt = Date.now(); // trip the circuit breaker
    cachedToken = null;
    tokenExpiresAt = null;
    console.error("Shiprocket Auth Error:", error?.response?.data || error?.message);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to authenticate with Shiprocket"
    );
  }
}

const SHIPROCKET_STATUS_MAP = {
  NEW: "Processing",
  "READY TO SHIP": "Ready To Ship",
  "PICKUP BOOKED": "Pickup Booked",
  "PICKUP SCHEDULED": "Pickup Scheduled",
  "PICKUP QUEUED": "Pickup Queued",
  "PICKUP RESCHEDULED": "Pickup Rescheduled",
  "PICKUP ERROR": "Pickup Error",
  "OUT FOR PICKUP": "Out For Pickup",
  "PICKUP EXCEPTION": "Pickup Exception",
  PICKUP: "Pickup",
  "PICKED UP": "Pickup",
  SHIPPED: "Shipped",
  "IN TRANSIT": "In Transit",
  "IN TRANSIT OVERSEAS": "In Transit Overseas",
  "IN TRANSIT-EN-ROUTE": "In Transit-en-Route",
  "REACHED AT DESTINATION HUB": "Out for Delivery",
  "OUT FOR DELIVERY": "Out for Delivery",
  DELIVERED: "Delivered",
  "CANCELLATION REQUESTED": "Cancelled",
  CANCELED: "Cancelled",
};

async function createShiprocketOrder({ order, items, address }) {
  const token = await getShiprocketToken();

  const isPaid = ["paid", "success", "completed"].includes(
    String(order.TransactionStatus || "").toLowerCase()
  );
  const paymentMethod = isPaid ? "Prepaid" : "COD";

  const orderDateObj = order.OrderDate ? new Date(order.OrderDate) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const formattedDate = `${orderDateObj.getFullYear()}-${pad(
    orderDateObj.getMonth() + 1
  )}-${pad(orderDateObj.getDate())} ${pad(orderDateObj.getHours())}:${pad(
    orderDateObj.getMinutes()
  )}`;

  const customerName =
    address?.OrderShippingAddressName || order?.CustomerName || "Customer";
  const customerEmail =
    address?.OrderShippingAddressEmailID ||
    order?.CustomerEmailID ||
    "order@legacyofmarwar.com";
  const customerPhone =
    (address?.OrderShippingAddressPhoneNo || order?.CustomerPhoneNo || "")
      .replace(/\D/g, "")
      .slice(-10) || "9999999999";

  const fullAddress =
    address?.OrderShippingAddressFullAddress ||
    [address?.OrderShippingAddressLocality, address?.OrderShippingAddressCity]
      .filter(Boolean)
      .join(", ") ||
    "DLF Phase 1";
  const locality = address?.OrderShippingAddressLocality || "";
  const city = address?.OrderShippingAddressCity || "Gurgaon";
  const state = address?.OrderShippingAddressState || "Haryana";
  const pincode = String(address?.OrderShippingAddressPinCode || "122002");

  const orderItems = (items && items.length > 0 ? items : [
    {
      ProductName: "Jewelry Item",
      ProductCode: "LOM-001",
      ProductQuantity: 1,
      ProductSalePrice: Number(order.OrderTotalAmount || 1),
    },
  ]).map((item) => ({
    name: String(item.ProductName || "Item").slice(0, 100),
    sku: String(item.ProductCode || item.ProductID || "SKU-" + (item.CustomerOrderHistoryID || 1)),
    units: Number(item.ProductQuantity || 1),
    selling_price: Number(item.ProductSalePrice || 0),
    discount: 0,
    tax: 0,
    hsn: 0,
  }));

  const subTotal = Number(order.OrderTotalAmount || 0);

  const payload = {
    order_id: String(order.OrderNo),
    order_date: formattedDate,
    pickup_location: SHIPROCKET_CONFIG.pickup_location,
    channel_id: "",
    comment: "Legacy of Marwar Customer Order",
    billing_customer_name: customerName,
    billing_last_name: "",
    billing_address: fullAddress,
    billing_address_2: locality,
    billing_city: city,
    billing_pincode: pincode,
    billing_state: state,
    billing_country: "India",
    billing_email: customerEmail,
    billing_phone: customerPhone,
    shipping_is_billing: true,
    shipping_customer_name: customerName,
    shipping_last_name: "",
    shipping_address: fullAddress,
    shipping_address_2: locality,
    shipping_city: city,
    shipping_pincode: pincode,
    shipping_country: "India",
    shipping_state: state,
    shipping_email: customerEmail,
    shipping_phone: customerPhone,
    order_items: orderItems,
    payment_method: paymentMethod,
    shipping_charges: Number(order.TotalShippingAmount || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.CouponValue || 0),
    sub_total: subTotal,
    length: 10,
    breadth: 15,
    height: 10,
    weight: 0.5,
  };

  try {
    const response = await axios.post(SHIPROCKET_CREATE_ORDER_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 20000,
    });

    const data = response.data;
    return {
      success: true,
      shipment_id: data?.shipment_id,
      order_id: data?.order_id,
      awb_code: data?.awb_code || null,
      courier_name: data?.courier_name || null,
      status: data?.status || "Processing",
      raw: data,
    };
  } catch (error) {
    console.error("Shiprocket Create Order Error:", error?.response?.data || error?.message);
    const errorMsg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error.response.data : "") ||
      error?.message ||
      "Failed to create order on Shiprocket";
    throw new Error(errorMsg);
  }
}

async function getShiprocketOrders(days = 7) {
  const token = await getShiprocketToken();
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  try {
    const response = await axios.get(SHIPROCKET_ORDERS_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        from: formatDate(fromDate),
        to: formatDate(toDate),
      },
      timeout: 20000,
    });

    const list = response.data?.data || [];
    return list.map((item) => {
      const channelOrderId = String(item.channel_order_id || item.id || "");
      const normalizedOrderNo = channelOrderId.replace(/_\d+$/, "");
      const rawStatus = String(item.status || "").toUpperCase();
      const mappedStatus = SHIPROCKET_STATUS_MAP[rawStatus] || "Processing";
      const shipment = Array.isArray(item.shipments) && item.shipments[0] ? item.shipments[0] : {};

      return {
        order_no: normalizedOrderNo,
        shiprocket_order_id: item.id,
        shipment_id: shipment.id || item.shipment_id,
        awb_code: shipment.awb || null,
        courier_name: shipment.courier_name || null,
        status: mappedStatus,
        raw_status: rawStatus,
      };
    });
  } catch (error) {
    console.error("Shiprocket Get Orders Error:", error?.response?.data || error?.message);
    throw new Error(error?.response?.data?.message || error?.message || "Failed to fetch Shiprocket orders");
  }
}

async function trackShiprocketOrder(orderNoOrAwb) {
  const token = await getShiprocketToken();
  try {
    const response = await axios.get(SHIPROCKET_TRACK_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        order_id: String(orderNoOrAwb),
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error("Shiprocket Track Error:", error?.response?.data || error?.message);
    throw new Error(error?.response?.data?.message || error?.message || "Tracking info not available");
  }
}

module.exports = {
  SHIPROCKET_CONFIG,
  SHIPROCKET_STATUS_MAP,
  getShiprocketToken,
  createShiprocketOrder,
  getShiprocketOrders,
  trackShiprocketOrder,
};