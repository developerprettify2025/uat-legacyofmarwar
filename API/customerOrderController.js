const db = require("../db");
const { randomBytes } = require("crypto");
const shiprocketService = require("../services/shiprocketService");
const { sendEmail } = require("../middleware/emailTemplates");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Ready To Ship",
  "Pickup Booked",
  "Pickup Scheduled",
  "Pickup Queued",
  "Pickup Rescheduled",
  "Pickup Error",
  "Out For Pickup",
  "Pickup Exception",
  "Pickup",
  "Shipped",
  "In Transit",
  "In Transit Overseas",
  "In Transit-en-Route",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Packed",
];
const PAYMENT_STATUSES = ["Pending", "Paid"];
const ORDER_NO_START = 1000;
const query = (connection, sql, values = []) =>
  new Promise((resolve, reject) => {
    connection.query(sql, values, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
const validID = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const createTransactionID = (OrderNo) => `LM${OrderNo}`;
async function sendOrderConfirmationEmail(OrderNo) {
  const orders = await query(
    db,
    `SELECT O.OrderNo, O.CustomerOrderListID, O.OrderTotalAmount,
            C.CustomerName, C.CustomerEmailID,
            S.OrderShippingAddressName, S.OrderShippingAddressEmailID
     FROM mst_customerorderdata O
     LEFT JOIN mst_customerdata C ON C.CustomerID = O.CustomerID
     LEFT JOIN mst_ordershippingaddressdata S ON S.OrderNo = O.OrderNo
     WHERE O.OrderNo = ?
     ORDER BY S.OrderShippingAddressID DESC
     LIMIT 1`,
    [OrderNo],
  );
  if (!orders.length) return;
  const order = orders[0];
  const recipient = order.CustomerEmailID || order.OrderShippingAddressEmailID;
  if (!recipient) return;

  const items = await query(
    db,
    `SELECT ProductName, ColorName, ProductQuantity, ProductTotalAmount
     FROM mst_customerorderhistorydata
     WHERE OrderNo = ?
     ORDER BY CustomerOrderHistoryID`,
    [OrderNo],
  );

  await sendEmail("order_confirmation", recipient, {
    CustomerName: order.CustomerName || order.OrderShippingAddressName,
    OrderNo: order.OrderNo,
    OrderTotalAmount: order.OrderTotalAmount,
    items,
  });
}

exports.getOrderFormData = (req, res) => {
  db.query(
    `SELECT CustomerID, CustomerName, CustomerEmailID, CustomerPhoneNo
     FROM mst_customerdata ORDER BY CustomerName`,
    (customerError, customers) => {
      if (customerError) {
        console.error("Load order customers error:", customerError);
        return res
          .status(500)
          .json({ success: false, message: "Failed to load customers." });
      }
      db.query(
        `SELECT PC.ProductColorID, PC.ProductID, PC.ColorID,
                PC.ProductMRP, PC.ProductSalePrice, PC.ProductTotalStock,
                P.ProductName, P.ProductImage, P.ProductCode, C.ColorName
         FROM mst_productcolordata PC
         INNER JOIN mst_productdata P ON P.ProductID = PC.ProductID
         LEFT JOIN mst_colordata C ON C.ColorID = PC.ColorID
         WHERE P.ActiveStatus = 1
         ORDER BY P.ProductName, C.ColorName`,
        (productError, products) => {
          if (productError) {
            console.error("Load order products error:", productError);
            return res
              .status(500)
              .json({ success: false, message: "Failed to load products." });
          }
          return res.json({
            success: true,
            data: {
              customers,
              products,
              orderStatuses: ORDER_STATUSES,
              paymentStatuses: PAYMENT_STATUSES,
            },
          });
        },
      );
    },
  );
};

exports.getCustomerOrderAddresses = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid customer ID." });
  }
  db.query(
    `SELECT CustomerShippingAddressID, CustomerID, CustomerShippingAddressName,
            CustomerShippingAddressPhoneNo, CustomerShippingAddressEmailID,
            CustomerShippingAddressPinCode, CustomerShippingAddressFullAddress,
            CustomerShippingAddressLocality, CustomerShippingAddressCity,
            CustomerShippingAddressState
     FROM mst_customershippingaddressdata
     WHERE CustomerID = ? ORDER BY CustomerShippingAddressID DESC`,
    [CustomerID],
    (error, rows) => {
      if (error) {
        console.error("Load order shipping addresses error:", error);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to load shipping addresses.",
          });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getAllOrders = async (req, res) => {
  // NOTE: Auto-sync removed from here to prevent hammering Shiprocket on every page load.
  // Use the dedicated "Sync Shiprocket" button in the UI (POST /shiprocket/sync) instead.

  db.query(
    `SELECT O.CustomerOrderListID, O.OrderNo, O.OrderDate, O.CustomerID,
            O.CouponCode, O.CouponValue, O.TotalUseEarnDiscount, O.TotalEarnPoints,
            O.TotalGSTAmount, O.TotalShippingAmount, O.OrderTotalAmount,
            O.PaymentOption, O.PaymentID, O.TransactionID,
            CASE WHEN LOWER(O.TransactionStatus) IN ('success', 'paid')
                 THEN 'Paid' ELSE 'Pending' END AS TransactionStatus,
            O.OrderStatus, O.DeliveryDate, O.IsRead, C.CustomerName,
            C.CustomerEmailID, C.CustomerPhoneNo,
            A.OrderShippingAddressName, A.OrderShippingAddressPhoneNo,
            A.OrderShippingAddressEmailID, A.OrderShippingAddressPinCode,
            A.OrderShippingAddressFullAddress, A.OrderShippingAddressLocality,
            A.OrderShippingAddressCity, A.OrderShippingAddressState
     FROM mst_customerorderdata O
     LEFT JOIN mst_customerdata C ON C.CustomerID = O.CustomerID
     LEFT JOIN mst_ordershippingaddressdata A
       ON A.OrderShippingAddressID = (
         SELECT MAX(A2.OrderShippingAddressID)
         FROM mst_ordershippingaddressdata A2
         WHERE A2.OrderNo = O.OrderNo
       )
     ORDER BY O.OrderDate DESC, O.OrderNo DESC`,
    (orderError, orders) => {
      if (orderError) {
        console.error("Load customer orders error:", orderError);
        return res
          .status(500)
          .json({ success: false, message: "Failed to load orders." });
      }
      db.query(
        `SELECT CustomerOrderListID, OrderNo, ProductID, ProductName, ProductURL,
                ProductImage, Category, ColorName, ProductQuantity,
                ProductMRP, ProductSalePrice, ProductDiscount, ProductTotalAmount
         FROM mst_customerorderhistorydata ORDER BY CustomerOrderHistoryID`,
        (itemError, items) => {
          if (itemError) {
            console.error("Load order items error:", itemError);
            return res
              .status(500)
              .json({ success: false, message: "Failed to load order items." });
          }
          const itemsByOrder = new Map();
          items.forEach((item) => {
            const key = Number(item.CustomerOrderListID);
            if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
            itemsByOrder.get(key).push(item);
          });
          db.query(
            `SELECT CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn
             FROM mst_customerorderstatushistorydata
             ORDER BY CustomerOrderStatusHistoryID ASC`,
            (historyError, historyRows) => {
              const historyByOrder = new Map();
              (historyRows || []).forEach((row) => {
                const k = Number(row.OrderNo);
                if (!historyByOrder.has(k)) historyByOrder.set(k, []);
                historyByOrder.get(k).push(row);
              });

              return res.json({
                success: true,
                data: orders.map((order) => {
                  const historyList =
                    historyByOrder.get(Number(order.OrderNo)) || [];
                  // Scan all remarks (newest first) to find Shiprocket shipment_id / awb_code
                  let shipment_id = null;
                  let awb_code = null;
                  let courier_name = null;
                  for (let i = historyList.length - 1; i >= 0; i--) {
                    const remark = String(historyList[i].Remarks || "");
                    if (!shipment_id) {
                      const m = remark.match(
                        /Shipment(?:\s+ID)?:?\s*([A-Za-z0-9_-]+)/i,
                      );
                      if (m) shipment_id = m[1];
                    }
                    if (!awb_code) {
                      const m = remark.match(/AWB:?\s*([A-Za-z0-9_-]+)/i);
                      if (m) awb_code = m[1];
                    }
                    if (!courier_name) {
                      const m = remark.match(/Courier:?\s*([^\|]+)/i);
                      if (m) courier_name = m[1].trim();
                    }
                    if (shipment_id && awb_code) break;
                  }
                  return {
                    ...order,
                    items:
                      itemsByOrder.get(Number(order.CustomerOrderListID)) || [],
                    statusHistory: historyList,
                    shipment_id,
                    awb_code,
                    courier_name: courier_name || null,
                  };
                }),
              });
            },
          );
        },
      );
    },
  );
};

/*exports.createOrder = async (req, res) => {
  const CustomerID = Number(req.body.CustomerID);
  const CustomerShippingAddressID = Number(req.body.CustomerShippingAddressID);
  const PaymentStatus = req.body.TransactionStatus;
  const OrderStatus = req.body.OrderStatus;
  const UpdatedBy = typeof req.body.UpdatedBy === "string"
    ? req.body.UpdatedBy.trim().slice(0, 50)
    : "Admin Panel";
  let items;
  try {
    items = typeof req.body.items === "string" ? JSON.parse(req.body.items) : req.body.items;
  } catch {
    return res.status(400).json({ success: false, message: "Invalid order items." });
  }
  if (
    !validID(CustomerID) ||
    !validID(CustomerShippingAddressID) ||
    !PAYMENT_STATUSES.includes(PaymentStatus) ||
    !ORDER_STATUSES.includes(OrderStatus) ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: "Select a customer, shipping address, valid statuses, and at least one product.",
    });
  }

  const normalizedItems = [];
  const seenVariants = new Set();
  for (const item of items) {
    const ProductColorID = Number(item.ProductColorID);
    const ProductQuantity = Number(item.ProductQuantity);
    if (
      !validID(ProductColorID) ||
      !Number.isInteger(ProductQuantity) ||
      ProductQuantity < 1 ||
      ProductQuantity > 2147483647 ||
      seenVariants.has(ProductColorID)
    ) {
      return res.status(400).json({
        success: false,
        message: "Each product variant must be unique and have a valid quantity.",
      });
    }
    seenVariants.add(ProductColorID);
    normalizedItems.push({ ProductColorID, ProductQuantity });
  }

  let connection;
  let lockAcquired = false;
  let transactionStarted = false;
  try {
    connection = await new Promise((resolve, reject) =>
      db.getConnection((error, result) => (error ? reject(error) : resolve(result))),
    );
    const lockRows = await query(
      connection,
      "SELECT GET_LOCK('legacy_marwar_customer_order_number', 10) AS acquired",
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      return res.status(503).json({
        success: false,
        message: "Could not reserve an order number. Please try again.",
      });
    }
    lockAcquired = true;
    await new Promise((resolve, reject) =>
      connection.beginTransaction((error) => (error ? reject(error) : resolve())),
    );
    transactionStarted = true;

    const customerRows = await query(
      connection,
      "SELECT CustomerID FROM mst_customerdata WHERE CustomerID = ? LIMIT 1",
      [CustomerID],
    );
    if (!customerRows.length) {
      await new Promise((resolve, reject) =>
        connection.rollback((error) => (error ? reject(error) : resolve())),
      );
      transactionStarted = false;
      return res.status(404).json({ success: false, message: "Customer not found." });
    }
    const addressRows = await query(
      connection,
      `SELECT CustomerShippingAddressName, CustomerShippingAddressPhoneNo,
              CustomerShippingAddressEmailID, CustomerShippingAddressPinCode,
              CustomerShippingAddressFullAddress, CustomerShippingAddressLocality,
              CustomerShippingAddressCity, CustomerShippingAddressState
       FROM mst_customershippingaddressdata
       WHERE CustomerShippingAddressID = ? AND CustomerID = ? LIMIT 1`,
      [CustomerShippingAddressID, CustomerID],
    );
    if (!addressRows.length) {
      await new Promise((resolve, reject) =>
        connection.rollback((error) => (error ? reject(error) : resolve())),
      );
      transactionStarted = false;
      return res.status(404).json({
        success: false,
        message: "Shipping address was not found for this customer.",
      });
    }

    const variantIDs = normalizedItems.map(({ ProductColorID }) => ProductColorID);
    const placeholders = variantIDs.map(() => "?").join(",");
    const variantRows = await query(
      connection,
      `SELECT PC.ProductColorID, PC.ProductID, PC.ProductMRP, PC.ProductSalePrice,
              P.ProductName, P.ProductNameURL, P.ProductImage, P.ProductCode,
              C.CategoryName, COALESCE(CL.ColorName, '') AS ColorName
       FROM mst_productcolordata PC
       INNER JOIN mst_productdata P ON P.ProductID = PC.ProductID
       LEFT JOIN mst_categorydata C ON C.CategoryID = P.CategoryID
       LEFT JOIN mst_colordata CL ON CL.ColorID = PC.ColorID
       WHERE PC.ProductColorID IN (${placeholders}) AND P.ActiveStatus = 1`,
      variantIDs,
    );
    if (variantRows.length !== normalizedItems.length) {
      await new Promise((resolve, reject) =>
        connection.rollback((error) => (error ? reject(error) : resolve())),
      );
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "One or more selected product variants are unavailable.",
      });
    }

    const orderNoRows = await query(
      connection,
      "SELECT COALESCE(MAX(OrderNo), 0) + 1 AS nextOrderNo FROM mst_customerorderdata",
    );
    const listIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderListID), 0) + 1 AS nextListID FROM mst_customerorderdata",
    );
    const itemIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderHistoryID), 0) + 1 AS nextItemID FROM mst_customerorderhistorydata",
    );
    const statusHistoryIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextStatusHistoryID FROM mst_customerorderstatushistorydata",
    );
    const OrderNo = Number(orderNoRows[0]?.nextOrderNo);
    const CustomerOrderListID = Number(listIDRows[0]?.nextListID);
    let nextItemID = Number(itemIDRows[0]?.nextItemID);
    const nextStatusHistoryID = Number(statusHistoryIDRows[0]?.nextStatusHistoryID);
    if (
      !Number.isInteger(OrderNo) ||
      OrderNo < 1 ||
      OrderNo > 2147483647 ||
      !Number.isInteger(CustomerOrderListID) ||
      CustomerOrderListID < 1 ||
      CustomerOrderListID > 2147483647 ||
      !Number.isInteger(nextItemID) ||
      nextItemID < 1 ||
      nextItemID + normalizedItems.length - 1 > 2147483647 ||
      !Number.isInteger(nextStatusHistoryID) ||
      nextStatusHistoryID < 1 ||
      nextStatusHistoryID > 2147483647
    ) {
      throw new Error("The order number sequence has exceeded the supported range.");
    }

    const productRowsByID = new Map(
      variantRows.map((product) => [Number(product.ProductColorID), product]),
    );
    const orderItems = normalizedItems.map((item) => {
      const product = productRowsByID.get(item.ProductColorID);
      const mrp = Number(product.ProductMRP);
      const salePrice = Number(product.ProductSalePrice);
      if (
        !Number.isInteger(mrp) ||
        !Number.isInteger(salePrice) ||
        mrp < 0 ||
        salePrice < 0 ||
        salePrice > mrp
      ) {
        throw new Error(`Invalid price configured for ${product.ProductName}.`);
      }
      return {
        ...item,
        product,
        mrp,
        salePrice,
        total: salePrice * item.ProductQuantity,
      };
    });
    const orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    if (!Number.isSafeInteger(orderTotal) || orderTotal > 2147483647) {
      throw new Error("Order total exceeds the supported amount.");
    }

    const TransactionID =
      PaymentStatus === "Paid" ? createTransactionID(OrderNo) : null;
    await query(
      connection,
      `INSERT INTO mst_customerorderdata
       (CustomerOrderListID, OrderNo, CustomerID, CouponValue, TotalUseEarnDiscount,
        TotalEarnPoints, TotalGSTAmount, TotalShippingAmount, OrderTotalAmount,
        PaymentOption, TransactionID, TransactionStatus, OrderStatus, UpdatedBy, UpdatedOn, IsRead)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?, 'Admin', ?, ?, ?, ?, NOW(), 1)`,
      [
        CustomerOrderListID,
        OrderNo,
        CustomerID,
        orderTotal,
        TransactionID,
        PaymentStatus,
        OrderStatus,
        UpdatedBy,
      ],
    );

    const address = addressRows[0];
    await query(
      connection,
      `INSERT INTO mst_ordershippingaddressdata
       (OrderNo, OrderShippingAddressName, OrderShippingAddressPhoneNo,
        OrderShippingAddressEmailID, OrderShippingAddressPinCode,
        OrderShippingAddressFullAddress, OrderShippingAddressLocality,
        OrderShippingAddressCity, OrderShippingAddressState, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        OrderNo,
        address.CustomerShippingAddressName,
        address.CustomerShippingAddressPhoneNo,
        address.CustomerShippingAddressEmailID,
        address.CustomerShippingAddressPinCode,
        address.CustomerShippingAddressFullAddress,
        address.CustomerShippingAddressLocality,
        address.CustomerShippingAddressCity,
        address.CustomerShippingAddressState,
        UpdatedBy,
      ],
    );

    for (const item of orderItems) {
      const product = item.product;
      await query(
        connection,
        `INSERT INTO mst_customerorderhistorydata
         (CustomerOrderHistoryID, CustomerOrderListID, OrderNo, ProductID, ProductName, ProductURL,
          ProductImage, Category, ColorName, ProductQuantity,
          ProductMRP, ProductSalePrice, ProductDiscount, ProductTotalAmount,
          UpdatedBy, UpdatedOn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nextItemID,
          CustomerOrderListID,
          OrderNo,
          product.ProductID,
          product.ProductName,
          product.ProductNameURL || "",
          product.ProductImage || "",
          product.CategoryName || "",
          product.ColorName || "Default",
          item.ProductQuantity,
          item.mrp,
          item.salePrice,
          item.mrp - item.salePrice,
          item.total,
          UpdatedBy,
        ],
      );
      nextItemID += 1;
    }

    await query(
      connection,
      `INSERT INTO mst_customerorderstatushistorydata
       (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        nextStatusHistoryID,
        OrderNo,
        OrderStatus,
        "Order created by admin.",
        UpdatedBy || "Admin Panel",
      ],
    );
    await new Promise((resolve, reject) =>
      connection.commit((error) => (error ? reject(error) : resolve())),
    );
    transactionStarted = false;
    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      OrderNo,
      CustomerOrderListID,
      TransactionID,
    });
  } catch (error) {
    if (transactionStarted && connection) {
      await new Promise((resolve) => connection.rollback(() => resolve()));
    }
    console.error("Create customer order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message.includes("supported") || error.message.includes("configured")
        ? error.message
        : "Failed to create order.",
    });
  } finally {
    if (connection && lockAcquired) {
      try {
        await query(connection, "SELECT RELEASE_LOCK('legacy_marwar_customer_order_number')");
      } catch (error) {
        console.error("Release order number lock error:", error);
      }
    }
    if (connection) connection.release();
  }
};*/

// Replace your existing exports.createOrder with this whole function.
// Uses the same helpers already in your file: db, query, validID, createTransactionID,
// ORDER_STATUSES, PAYMENT_STATUSES.

// Replace your existing exports.createOrder with this whole function.
// Uses the same helpers already in your file: db, query, validID, createTransactionID,
// ORDER_STATUSES, PAYMENT_STATUSES.

exports.createOrder = async (req, res) => {
  const CustomerID = Number(req.body.CustomerID);
  const CustomerShippingAddressID = Number(req.body.CustomerShippingAddressID);
  const PaymentStatus = req.body.TransactionStatus;
  const OrderStatus = req.body.OrderStatus;
  const PaymentOption = ["Online", "COD"].includes(req.body.PaymentMode)
    ? req.body.PaymentMode
    : "Admin"; // admin panel se aaye to pehle jaisa
  const isWebsiteOrder = PaymentOption !== "Admin";
  const requestedCoupon =
    typeof req.body.CouponCode === "string" ? req.body.CouponCode.trim() : "";
  const UpdatedBy =
    typeof req.body.UpdatedBy === "string"
      ? req.body.UpdatedBy.trim().slice(0, 50)
      : "Admin Panel";
  let items;
  try {
    items =
      typeof req.body.items === "string"
        ? JSON.parse(req.body.items)
        : req.body.items;
  } catch {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order items." });
  }
  if (
    !validID(CustomerID) ||
    !validID(CustomerShippingAddressID) ||
    !PAYMENT_STATUSES.includes(PaymentStatus) ||
    !ORDER_STATUSES.includes(OrderStatus) ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Select a customer, shipping address, valid statuses, and at least one product.",
    });
  }

  // 1) storefront cart: ProductColorID na ho to ProductID + ColorID se nikalo
  try {
    for (const item of items) {
      if (!item || validID(item.ProductColorID) || !validID(item.ProductID))
        continue;

      const productID = Number(item.ProductID);
      const colorID = Number(item.ColorID) || 0;

      const rows =
        colorID > 0
          ? await query(
              db,
              `SELECT ProductColorID FROM mst_productcolordata
             WHERE ProductID = ? AND ColorID = ? LIMIT 1`,
              [productID, colorID],
            )
          : await query(
              db,
              `SELECT ProductColorID FROM mst_productcolordata
             WHERE ProductID = ? ORDER BY ProductColorID LIMIT 1`,
              [productID],
            );

      if (rows.length) item.ProductColorID = rows[0].ProductColorID;
    }
  } catch (error) {
    console.error("Resolve product variant error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create order." });
  }

  // 2) items validate (har error ka alag message)
  const normalizedItems = [];
  const seenVariants = new Set();
  for (const item of items) {
    const ProductColorID = Number(item?.ProductColorID);
    const ProductQuantity = Number(item?.ProductQuantity);

    if (!validID(ProductColorID)) {
      return res.status(400).json({
        success: false,
        message:
          "A product in your cart could not be matched. Please remove it and add it again.",
      });
    }
    if (
      !Number.isInteger(ProductQuantity) ||
      ProductQuantity < 1 ||
      ProductQuantity > 2147483647
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product quantity." });
    }
    if (seenVariants.has(ProductColorID)) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product variant in the order.",
      });
    }
    seenVariants.add(ProductColorID);
    normalizedItems.push({ ProductColorID, ProductQuantity });
  }

  let connection;
  let lockAcquired = false;
  let transactionStarted = false;
  const rollback = () =>
    new Promise((resolve, reject) =>
      connection.rollback((error) => (error ? reject(error) : resolve())),
    );

  try {
    connection = await new Promise((resolve, reject) =>
      db.getConnection((error, result) =>
        error ? reject(error) : resolve(result),
      ),
    );
    const lockRows = await query(
      connection,
      "SELECT GET_LOCK('legacy_marwar_customer_order_number', 10) AS acquired",
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      return res.status(503).json({
        success: false,
        message: "Could not reserve an order number. Please try again.",
      });
    }
    lockAcquired = true;
    await new Promise((resolve, reject) =>
      connection.beginTransaction((error) =>
        error ? reject(error) : resolve(),
      ),
    );
    transactionStarted = true;

    const customerRows = await query(
      connection,
      "SELECT CustomerID FROM mst_customerdata WHERE CustomerID = ? LIMIT 1",
      [CustomerID],
    );
    if (!customerRows.length) {
      await rollback();
      transactionStarted = false;
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }
    const addressRows = await query(
      connection,
      `SELECT CustomerShippingAddressName, CustomerShippingAddressPhoneNo,
              CustomerShippingAddressEmailID, CustomerShippingAddressPinCode,
              CustomerShippingAddressFullAddress, CustomerShippingAddressLocality,
              CustomerShippingAddressCity, CustomerShippingAddressState
       FROM mst_customershippingaddressdata
       WHERE CustomerShippingAddressID = ? AND CustomerID = ? LIMIT 1`,
      [CustomerShippingAddressID, CustomerID],
    );
    if (!addressRows.length) {
      await rollback();
      transactionStarted = false;
      return res.status(404).json({
        success: false,
        message: "Shipping address was not found for this customer.",
      });
    }

    const variantIDs = normalizedItems.map(
      ({ ProductColorID }) => ProductColorID,
    );
    const placeholders = variantIDs.map(() => "?").join(",");
    const variantRows = await query(
      connection,
      `SELECT PC.ProductColorID, PC.ProductID, PC.ProductMRP, PC.ProductSalePrice,
              P.ProductName, P.ProductNameURL, P.ProductImage, P.ProductCode,
              C.CategoryName, COALESCE(CL.ColorName, '') AS ColorName
       FROM mst_productcolordata PC
       INNER JOIN mst_productdata P ON P.ProductID = PC.ProductID
       LEFT JOIN mst_categorydata C ON C.CategoryID = P.CategoryID
       LEFT JOIN mst_colordata CL ON CL.ColorID = PC.ColorID
       WHERE PC.ProductColorID IN (${placeholders}) AND P.ActiveStatus = 1`,
      variantIDs,
    );
    if (variantRows.length !== normalizedItems.length) {
      await rollback();
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "One or more selected product variants are unavailable.",
      });
    }

    // OrderNo kam se kam 1000 se shuru, har order par +1
    const orderNoRows = await query(
      connection,
      "SELECT GREATEST(COALESCE(MAX(OrderNo), 0) + 1, ?) AS nextOrderNo FROM mst_customerorderdata",
      [ORDER_NO_START],
    );
    const listIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderListID), 0) + 1 AS nextListID FROM mst_customerorderdata",
    );
    const itemIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderHistoryID), 0) + 1 AS nextItemID FROM mst_customerorderhistorydata",
    );
    const statusHistoryIDRows = await query(
      connection,
      "SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextStatusHistoryID FROM mst_customerorderstatushistorydata",
    );
    const OrderNo = Number(orderNoRows[0]?.nextOrderNo);
    const CustomerOrderListID = Number(listIDRows[0]?.nextListID);
    let nextItemID = Number(itemIDRows[0]?.nextItemID);
    const nextStatusHistoryID = Number(
      statusHistoryIDRows[0]?.nextStatusHistoryID,
    );
    if (
      !Number.isInteger(OrderNo) ||
      OrderNo < 1 ||
      OrderNo > 2147483647 ||
      !Number.isInteger(CustomerOrderListID) ||
      CustomerOrderListID < 1 ||
      CustomerOrderListID > 2147483647 ||
      !Number.isInteger(nextItemID) ||
      nextItemID < 1 ||
      nextItemID + normalizedItems.length - 1 > 2147483647 ||
      !Number.isInteger(nextStatusHistoryID) ||
      nextStatusHistoryID < 1 ||
      nextStatusHistoryID > 2147483647
    ) {
      throw new Error(
        "The order number sequence has exceeded the supported range.",
      );
    }

    const productRowsByID = new Map(
      variantRows.map((product) => [Number(product.ProductColorID), product]),
    );
    const orderItems = normalizedItems.map((item) => {
      const product = productRowsByID.get(item.ProductColorID);
      const mrp = Number(product.ProductMRP);
      const salePrice = Number(product.ProductSalePrice);
      if (
        !Number.isInteger(mrp) ||
        !Number.isInteger(salePrice) ||
        mrp < 0 ||
        salePrice < 0 ||
        salePrice > mrp
      ) {
        throw new Error(`Invalid price configured for ${product.ProductName}.`);
      }
      return {
        ...item,
        product,
        mrp,
        salePrice,
        total: salePrice * item.ProductQuantity,
      };
    });
    const subTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    if (!Number.isSafeInteger(subTotal) || subTotal > 2147483647) {
      throw new Error("Order total exceeds the supported amount.");
    }

    // 3) COUPON (server par dobara check, frontend par bharosa nahi)
    // NOTE: table / column names apne DB ke hisaab se check kar lo
    let CouponCode = null;
    let couponDiscount = 0;
    if (requestedCoupon) {
      const couponRows = await query(
        connection,
        `SELECT CouponCode, CouponType, CouponValue, CouponMinAmount, CouponExpiryDate
         FROM mst_coupondata WHERE CouponCode = ? LIMIT 1`,
        [requestedCoupon],
      );
      const coupon = couponRows[0];
      const expiry = coupon ? new Date(coupon.CouponExpiryDate) : null;
      if (expiry) expiry.setHours(23, 59, 59, 999); // expiry wale din bhi chalega

      if (!coupon) {
        await rollback();
        transactionStarted = false;
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon code." });
      }
      if (!expiry || Number.isNaN(expiry.getTime()) || new Date() > expiry) {
        await rollback();
        transactionStarted = false;
        return res
          .status(400)
          .json({ success: false, message: "This coupon has expired." });
      }
      if (subTotal < Number(coupon.CouponMinAmount || 0)) {
        await rollback();
        transactionStarted = false;
        return res.status(400).json({
          success: false,
          message: `Minimum order amount for this coupon is ₹${Number(coupon.CouponMinAmount)}.`,
        });
      }

      const rawDiscount =
        coupon.CouponType === "Percentage"
          ? (subTotal * Number(coupon.CouponValue)) / 100
          : Number(coupon.CouponValue); // "Fixed Amount"
      couponDiscount = Math.min(Math.round(rawDiscount), subTotal);
      CouponCode = coupon.CouponCode;
    }

    const orderTotal = subTotal - couponDiscount;

    const TransactionID =
      PaymentStatus === "Paid" ? createTransactionID(OrderNo) : null;
    await query(
      connection,
      `INSERT INTO mst_customerorderdata
       (CustomerOrderListID, OrderNo, CustomerID, CouponCode, CouponValue, TotalUseEarnDiscount,
        TotalEarnPoints, TotalGSTAmount, TotalShippingAmount, OrderTotalAmount,
        PaymentOption, TransactionID, TransactionStatus, OrderStatus, UpdatedBy, UpdatedOn, IsRead)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        CustomerOrderListID,
        OrderNo,
        CustomerID,
        CouponCode,
        couponDiscount, // CouponValue = discount amount (column NOT NULL, default 0)
        orderTotal,
        PaymentOption,
        TransactionID,
        PaymentStatus,
        OrderStatus,
        UpdatedBy,
      ],
    );

    const address = addressRows[0];
    await query(
      connection,
      `INSERT INTO mst_ordershippingaddressdata
       (OrderNo, OrderShippingAddressName, OrderShippingAddressPhoneNo,
        OrderShippingAddressEmailID, OrderShippingAddressPinCode,
        OrderShippingAddressFullAddress, OrderShippingAddressLocality,
        OrderShippingAddressCity, OrderShippingAddressState, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        OrderNo,
        address.CustomerShippingAddressName,
        address.CustomerShippingAddressPhoneNo,
        address.CustomerShippingAddressEmailID,
        address.CustomerShippingAddressPinCode,
        address.CustomerShippingAddressFullAddress,
        address.CustomerShippingAddressLocality,
        address.CustomerShippingAddressCity,
        address.CustomerShippingAddressState,
        UpdatedBy,
      ],
    );

    for (const item of orderItems) {
      const product = item.product;
      await query(
        connection,
        `INSERT INTO mst_customerorderhistorydata
         (CustomerOrderHistoryID, CustomerOrderListID, OrderNo, ProductID, ProductName, ProductURL,
          ProductImage, Category, ColorName, ProductQuantity,
          ProductMRP, ProductSalePrice, ProductDiscount, ProductTotalAmount,
          UpdatedBy, UpdatedOn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nextItemID,
          CustomerOrderListID,
          OrderNo,
          product.ProductID,
          product.ProductName,
          product.ProductNameURL || "",
          product.ProductImage || "",
          product.CategoryName || "",
          product.ColorName || "Default",
          item.ProductQuantity,
          item.mrp,
          item.salePrice,
          item.mrp - item.salePrice,
          item.total,
          UpdatedBy,
        ],
      );
      nextItemID += 1;
    }

    await query(
      connection,
      `INSERT INTO mst_customerorderstatushistorydata
       (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        nextStatusHistoryID,
        OrderNo,
        OrderStatus,
        isWebsiteOrder
          ? "Order placed from website."
          : "Order created by admin.",
        UpdatedBy || "Admin Panel",
      ],
    );
    await new Promise((resolve, reject) =>
      connection.commit((error) => (error ? reject(error) : resolve())),
    );
    transactionStarted = false;
    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      OrderNo,
      CustomerOrderListID,
      TransactionID,
      OrderTotalAmount: orderTotal, // thank you page ke liye
      CouponCode,
      CouponDiscount: couponDiscount,
    });
  } catch (error) {
    if (transactionStarted && connection) {
      await new Promise((resolve) => connection.rollback(() => resolve()));
    }
    console.error("Create customer order error:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message.includes("supported") ||
        error.message.includes("configured")
          ? error.message
          : "Failed to create order.",
    });
  } finally {
    if (connection && lockAcquired) {
      try {
        await query(
          connection,
          "SELECT RELEASE_LOCK('legacy_marwar_customer_order_number')",
        );
      } catch (error) {
        console.error("Release order number lock error:", error);
      }
    }
    if (connection) connection.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  const OrderNo = Number(req.params.OrderNo);
  const { OrderStatus, UpdatedBy, Remarks } = req.body;
  let { TransactionStatus } = req.body;

  // Normalize TransactionStatus — Razorpay may send "success"/"completed"/etc.
  const PAID_STATUSES = ["paid", "success", "completed", "done"];
  if (typeof TransactionStatus === "string") {
    if (PAID_STATUSES.includes(TransactionStatus.toLowerCase())) {
      TransactionStatus = "Paid";
    } else if (!PAYMENT_STATUSES.includes(TransactionStatus)) {
      TransactionStatus = "Pending";
    }
  } else {
    TransactionStatus = "Pending";
  }

  const updatedBy =
    typeof UpdatedBy === "string" && UpdatedBy.trim()
      ? UpdatedBy.trim().slice(0, 100)
      : "Admin Panel";
  if (
    !Number.isInteger(OrderNo) ||
    OrderNo < 1 ||
    !ORDER_STATUSES.includes(OrderStatus)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Select a valid order status." });
  }

  // Auto-hit Shiprocket when status is set to Processing
  let shiprocketInfo = null;
  if (OrderStatus === "Processing") {
    try {
      const orderData = await query(
        db,
        `SELECT O.CustomerOrderListID, O.OrderNo, O.OrderDate, O.CustomerID,
                O.CouponValue, O.TotalShippingAmount, O.OrderTotalAmount,
                O.PaymentOption, O.PaymentID, O.TransactionID, O.TransactionStatus, O.OrderStatus,
                C.CustomerName, C.CustomerEmailID, C.CustomerPhoneNo
         FROM mst_customerorderdata O
         LEFT JOIN mst_customerdata C ON C.CustomerID = O.CustomerID
         WHERE O.OrderNo = ? LIMIT 1`,
        [OrderNo],
      );
      const addressData = await query(
        db,
        `SELECT OrderShippingAddressName, OrderShippingAddressPhoneNo,
                OrderShippingAddressEmailID, OrderShippingAddressPinCode,
                OrderShippingAddressFullAddress, OrderShippingAddressLocality,
                OrderShippingAddressCity, OrderShippingAddressState
         FROM mst_ordershippingaddressdata
         WHERE OrderNo = ?
         ORDER BY OrderShippingAddressID DESC LIMIT 1`,
        [OrderNo],
      );
      const itemData = await query(
        db,
        `SELECT CustomerOrderHistoryID, ProductID, ProductName, ColorName,
                ProductQuantity, ProductSalePrice, ProductTotalAmount
         FROM mst_customerorderhistorydata
         WHERE CustomerOrderListID = ?
         ORDER BY CustomerOrderHistoryID`,
        [orderData[0]?.CustomerOrderListID],
      );

      if (orderData.length) {
        shiprocketInfo = await shiprocketService.createShiprocketOrder({
          order: orderData[0],
          items: itemData,
          address: addressData[0] || {},
        });
      }
    } catch (sErr) {
      console.error("Auto-hit Shiprocket on Processing error:", sErr.message);
    }
  }

  let connection;
  let lockAcquired = false;
  let transactionStarted = false;
  try {
    connection = await new Promise((resolve, reject) =>
      db.getConnection((error, result) =>
        error ? reject(error) : resolve(result),
      ),
    );
    const lockRows = await query(
      connection,
      "SELECT GET_LOCK('legacy_marwar_customer_order_number', 10) AS acquired",
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      return res.status(503).json({
        success: false,
        message: "Could not update the order safely. Please try again.",
      });
    }
    lockAcquired = true;
    await new Promise((resolve, reject) =>
      connection.beginTransaction((error) =>
        error ? reject(error) : resolve(),
      ),
    );
    transactionStarted = true;
    const rows = await query(
      connection,
      "SELECT OrderStatus, TransactionID FROM mst_customerorderdata WHERE OrderNo = ? LIMIT 1",
      [OrderNo],
    );
    if (!rows.length) {
      await new Promise((resolve, reject) =>
        connection.rollback((error) => (error ? reject(error) : resolve())),
      );
      transactionStarted = false;
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    const statusChanged =
      rows[0].OrderStatus !== OrderStatus || Boolean(shiprocketInfo);
    const TransactionID =
      TransactionStatus === "Paid"
        ? rows[0].TransactionID || createTransactionID(OrderNo)
        : rows[0].TransactionID;
    await query(
      connection,
      `UPDATE mst_customerorderdata
       SET OrderStatus = ?, TransactionStatus = ?, TransactionID = ?,
           UpdatedBy = ?, UpdatedOn = NOW(),
           DeliveryDate = CASE WHEN ? = 'Delivered' AND DeliveryDate IS NULL
                               THEN NOW() ELSE DeliveryDate END
       WHERE OrderNo = ?`,
      [
        OrderStatus,
        TransactionStatus,
        TransactionID,
        updatedBy,
        OrderStatus,
        OrderNo,
      ],
    );
    if (statusChanged) {
      const idRows = await query(
        connection,
        `SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextID
         FROM mst_customerorderstatushistorydata`,
      );
      const historyID = Number(idRows[0]?.nextID);
      if (
        !Number.isInteger(historyID) ||
        historyID < 1 ||
        historyID > 2147483647
      ) {
        throw new Error(
          "The order status history sequence has exceeded the supported range.",
        );
      }
      const remarks = shiprocketInfo?.shipment_id
        ? `Shiprocket Order Created | Shipment ID: ${shiprocketInfo.shipment_id}${shiprocketInfo.awb_code ? " | AWB: " + shiprocketInfo.awb_code : ""}${shiprocketInfo.courier_name ? " | Courier: " + shiprocketInfo.courier_name : ""}`
        : typeof Remarks === "string" && Remarks.trim()
          ? Remarks.trim().slice(0, 2000)
          : `Order status updated to ${OrderStatus}.`;

      await query(
        connection,
        `INSERT INTO mst_customerorderstatushistorydata
         (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [historyID, OrderNo, OrderStatus, remarks, updatedBy],
      );
    }
    await new Promise((resolve, reject) =>
      connection.commit((error) => (error ? reject(error) : resolve())),
    );
    transactionStarted = false;
    return res.json({
      success: true,
      message: shiprocketInfo?.shipment_id
        ? `Order set to Processing & created on Shiprocket! Shipment ID: ${shiprocketInfo.shipment_id}`
        : "Order updated successfully.",
      TransactionID,
      shiprocket: shiprocketInfo,
    });
  } catch (error) {
    if (transactionStarted && connection) {
      await new Promise((resolve) => connection.rollback(() => resolve()));
    }
    console.error("Update order status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update order." });
  } finally {
    if (connection && lockAcquired) {
      try {
        await query(
          connection,
          "SELECT RELEASE_LOCK('legacy_marwar_customer_order_number')",
        );
      } catch (error) {
        console.error("Release order number lock error:", error);
      }
    }
    if (connection) connection.release();
  }
};

exports.updateOrderPaymentStatus = async (req, res) => {
  const OrderNo = Number(req.params.OrderNo || req.body.OrderNo);
  const {
    PaymentID,
    TransactionID,
    TransactionStatus,
    OrderStatus,
    PaymentOption,
    UpdatedBy,
    Remarks,
  } = req.body;

  if (!Number.isInteger(OrderNo) || OrderNo < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Valid Order number is required." });
  }

  const updatedBy =
    typeof UpdatedBy === "string" && UpdatedBy.trim()
      ? UpdatedBy.trim().slice(0, 100)
      : "Website Payment";

  let connection;
  let lockAcquired = false;
  let transactionStarted = false;

  try {
    connection = await new Promise((resolve, reject) =>
      db.getConnection((error, result) =>
        error ? reject(error) : resolve(result),
      ),
    );

    const lockRows = await query(
      connection,
      "SELECT GET_LOCK('legacy_marwar_customer_order_number', 10) AS acquired",
    );
    if (Number(lockRows[0]?.acquired) !== 1) {
      return res.status(503).json({
        success: false,
        message: "Could not update the order safely. Please try again.",
      });
    }
    lockAcquired = true;
    await new Promise((resolve, reject) =>
      connection.beginTransaction((error) =>
        error ? reject(error) : resolve(),
      ),
    );
    transactionStarted = true;
    const rows = await query(
      connection,
      "SELECT OrderStatus, TransactionStatus, TransactionID, PaymentID FROM mst_customerorderdata WHERE OrderNo = ? LIMIT 1",
      [OrderNo],
    );
    if (!rows.length) {
      await new Promise((resolve, reject) =>
        connection.rollback((error) => (error ? reject(error) : resolve())),
      );
      transactionStarted = false;
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    const currentOrder = rows[0];
    const isPaid =
      TransactionStatus &&
      ["paid", "success"].includes(
        String(TransactionStatus).trim().toLowerCase(),
      );
    const finalTransactionStatus = isPaid
      ? "Paid"
      : TransactionStatus && PAYMENT_STATUSES.includes(TransactionStatus)
        ? TransactionStatus
        : currentOrder.TransactionStatus || "Paid";

    // Order status: if explicitly passed and valid, use it; if paid and pending, move to Confirmed
    let finalOrderStatus = currentOrder.OrderStatus;
    if (OrderStatus && ORDER_STATUSES.includes(OrderStatus)) {
      finalOrderStatus = OrderStatus;
    } else if (
      finalTransactionStatus === "Paid" &&
      (currentOrder.OrderStatus === "Pending" || !currentOrder.OrderStatus)
    ) {
      finalOrderStatus = "Confirmed";
    }

    const finalPaymentID =
      typeof PaymentID === "string" && PaymentID.trim()
        ? PaymentID.trim().slice(0, 150)
        : currentOrder.PaymentID || null;

    const finalTransactionID =
      typeof TransactionID === "string" && TransactionID.trim()
        ? TransactionID.trim().slice(0, 150)
        : finalPaymentID ||
          currentOrder.TransactionID ||
          (finalTransactionStatus === "Paid"
            ? createTransactionID(OrderNo)
            : null);

    const finalPaymentOption =
      typeof PaymentOption === "string" && PaymentOption.trim()
        ? PaymentOption.trim().slice(0, 50)
        : null;

    await query(
      connection,
      `UPDATE mst_customerorderdata
       SET OrderStatus = ?,
           TransactionStatus = ?,
           TransactionID = ?,
           PaymentID = ?,
           PaymentOption = COALESCE(?, PaymentOption),
           UpdatedBy = ?,
           UpdatedOn = NOW()
       WHERE OrderNo = ?`,
      [
        finalOrderStatus,
        finalTransactionStatus,
        finalTransactionID,
        finalPaymentID,
        finalPaymentOption,
        updatedBy,
        OrderNo,
      ],
    );
    const statusChanged = currentOrder.OrderStatus !== finalOrderStatus;
    if (statusChanged) {
      const idRows = await query(
        connection,
        `SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextID
         FROM mst_customerorderstatushistorydata`,
      );
      const historyID = Number(idRows[0]?.nextID);
      if (Number.isInteger(historyID) && historyID > 0) {
        const remarks =
          typeof Remarks === "string" && Remarks.trim()
            ? Remarks.trim().slice(0, 2000)
            : `Payment received via ${finalPaymentOption || "Gateway"}. PaymentID: ${finalPaymentID || "N/A"}`;
        await query(
          connection,
          `INSERT INTO mst_customerorderstatushistorydata
           (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [historyID, OrderNo, finalOrderStatus, remarks, updatedBy],
        );
      }
    }
    await new Promise((resolve, reject) =>
      connection.commit((error) => (error ? reject(error) : resolve())),
    );
    transactionStarted = false;

    const justPaid =
      finalTransactionStatus === "Paid" &&
      String(currentOrder.TransactionStatus || "") !== "Paid";
    if (justPaid) {
      sendOrderConfirmationEmail(OrderNo).catch((mailErr) =>
        console.error("Order confirmation email failed:", mailErr),
      );
    }

    return res.json({
      success: true,
      message: "Order payment status updated successfully.",
      data: {
        OrderNo,
        OrderStatus: finalOrderStatus,
        TransactionStatus: finalTransactionStatus,
        TransactionID: finalTransactionID,
        PaymentID: finalPaymentID,
      },
    });
  } catch (error) {
    if (transactionStarted && connection) {
      await new Promise((resolve) => connection.rollback(() => resolve()));
    }
    console.error("Update order payment status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update payment status." });
  } finally {
    if (connection && lockAcquired) {
      try {
        await query(
          connection,
          "SELECT RELEASE_LOCK('legacy_marwar_customer_order_number')",
        );
      } catch (error) {
        console.error("Release order number lock error:", error);
      }
    }
    if (connection) connection.release();
  }
};

exports.getCustomerOrders = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);

  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID.",
    });
  }

  const sql = `
    SELECT
      O.CustomerOrderListID,
      O.OrderNo,
      O.OrderDate,
      O.CustomerID,
      O.OrderTotalAmount,
      O.TransactionID,
      CASE
        WHEN LOWER(O.TransactionStatus) IN ('Success', 'paid')
        THEN 'Paid'
        ELSE 'NA'
      END AS TransactionStatus,
      O.OrderStatus,
      O.DeliveryDate
    FROM mst_customerorderdata O
    WHERE O.CustomerID = ?
    ORDER BY O.OrderDate DESC, O.OrderNo DESC
  `;

  db.query(sql, [CustomerID], (error, orders) => {
    if (error) {
      console.error("Customer orders error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load customer orders.",
      });
    }

    if (!orders.length) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const orderIDs = orders.map((order) => order.CustomerOrderListID);
    const placeholders = orderIDs.map(() => "?").join(",");

    const itemSql = `
      SELECT
        CustomerOrderListID,
        OrderNo,
        ProductID,
        ProductName,
        ProductURL,
        ProductImage,
        Category,
        ColorName,
        ProductQuantity,
        ProductMRP,
        ProductSalePrice,
        ProductDiscount,
        ProductTotalAmount
      FROM mst_customerorderhistorydata
      WHERE CustomerOrderListID IN (${placeholders})
      ORDER BY CustomerOrderHistoryID
    `;

    db.query(itemSql, orderIDs, (itemError, items) => {
      if (itemError) {
        console.error("Customer order items error:", itemError);
        return res.status(500).json({
          success: false,
          message: "Failed to load order items.",
        });
      }

      const itemsByOrder = new Map();

      items.forEach((item) => {
        const id = Number(item.CustomerOrderListID);

        if (!itemsByOrder.has(id)) {
          itemsByOrder.set(id, []);
        }

        itemsByOrder.get(id).push(item);
      });

      return res.json({
        success: true,
        data: orders.map((order) => ({
          ...order,
          items: itemsByOrder.get(Number(order.CustomerOrderListID)) || [],
        })),
      });
    });
  });
};

exports.getCustomerOrderDetail = async (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  const OrderNo = Number(req.params.OrderNo);

  if (!validID(CustomerID) || !validID(OrderNo)) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID or order number.",
    });
  }

  try {
    // order + shipping address (CustomerID aur OrderNo dono match hone chahiye)
    const orders = await query(
      db,
      `SELECT O.CustomerOrderListID, O.OrderNo, O.OrderDate, O.CustomerID,
              O.CouponCode, O.CouponValue, O.TotalGSTAmount, O.TotalShippingAmount,
              O.OrderTotalAmount, O.PaymentOption, O.TransactionID,
              CASE WHEN LOWER(O.TransactionStatus) IN ('success', 'paid')
                   THEN 'Paid' ELSE 'Pending' END AS TransactionStatus,
              O.OrderStatus, O.DeliveryDate,
              A.OrderShippingAddressName, A.OrderShippingAddressPhoneNo,
              A.OrderShippingAddressEmailID, A.OrderShippingAddressPinCode,
              A.OrderShippingAddressFullAddress, A.OrderShippingAddressLocality,
              A.OrderShippingAddressCity, A.OrderShippingAddressState
       FROM mst_customerorderdata O
       LEFT JOIN mst_ordershippingaddressdata A
         ON A.OrderShippingAddressID = (
           SELECT MAX(A2.OrderShippingAddressID)
           FROM mst_ordershippingaddressdata A2
           WHERE A2.OrderNo = O.OrderNo
         )
       WHERE O.CustomerID = ? AND O.OrderNo = ?
       LIMIT 1`,
      [CustomerID, OrderNo],
    );

    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    const order = orders[0];

    const [items, statusHistory] = await Promise.all([
      query(
        db,
        `SELECT ProductID, ProductName, ProductURL, ProductImage, Category, ColorName,
                ProductQuantity, ProductMRP, ProductSalePrice, ProductDiscount,
                ProductTotalAmount
         FROM mst_customerorderhistorydata
         WHERE CustomerOrderListID = ?
         ORDER BY CustomerOrderHistoryID`,
        [order.CustomerOrderListID],
      ),
      query(
        db,
        `SELECT OrderStatus, Remarks, UpdatedOn
         FROM mst_customerorderstatushistorydata
         WHERE OrderNo = ?
         ORDER BY CustomerOrderStatusHistoryID`,
        [OrderNo],
      ),
    ]);

    return res.json({
      success: true,
      data: { ...order, items, statusHistory },
    });
  } catch (error) {
    console.error("Customer order detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load order details.",
    });
  }
};

exports.createShiprocketOrder = async (req, res) => {
  const OrderNo = Number(req.params.OrderNo);
  if (!validID(OrderNo)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order number." });
  }

  try {
    const orders = await query(
      db,
      `SELECT O.CustomerOrderListID, O.OrderNo, O.OrderDate, O.CustomerID,
              O.CouponValue, O.TotalShippingAmount, O.OrderTotalAmount,
              O.PaymentOption, O.PaymentID, O.TransactionID, O.TransactionStatus, O.OrderStatus,
              C.CustomerName, C.CustomerEmailID, C.CustomerPhoneNo
       FROM mst_customerorderdata O
       LEFT JOIN mst_customerdata C ON C.CustomerID = O.CustomerID
       WHERE O.OrderNo = ? LIMIT 1`,
      [OrderNo],
    );

    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    const order = orders[0];

    const addressRows = await query(
      db,
      `SELECT OrderShippingAddressName, OrderShippingAddressPhoneNo,
              OrderShippingAddressEmailID, OrderShippingAddressPinCode,
              OrderShippingAddressFullAddress, OrderShippingAddressLocality,
              OrderShippingAddressCity, OrderShippingAddressState
       FROM mst_ordershippingaddressdata
       WHERE OrderNo = ?
       ORDER BY OrderShippingAddressID DESC LIMIT 1`,
      [OrderNo],
    );
    const address = addressRows[0] || {};

    const items = await query(
      db,
      `SELECT CustomerOrderHistoryID, ProductID, ProductName, ColorName,
              ProductQuantity, ProductSalePrice, ProductTotalAmount
       FROM mst_customerorderhistorydata
       WHERE CustomerOrderListID = ?
       ORDER BY CustomerOrderHistoryID`,
      [order.CustomerOrderListID],
    );

    const shiprocketResult = await shiprocketService.createShiprocketOrder({
      order,
      items,
      address,
    });

    const shipmentId = shiprocketResult.shipment_id || "";
    const awbCode = shiprocketResult.awb_code || "";
    const courierName = shiprocketResult.courier_name || "";
    const newStatus = "Processing";

    await query(
      db,
      `UPDATE mst_customerorderdata
       SET OrderStatus = ?, UpdatedBy = ?, UpdatedOn = NOW()
       WHERE OrderNo = ?`,
      [newStatus, "Shiprocket API", OrderNo],
    );

    const idRows = await query(
      db,
      "SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextID FROM mst_customerorderstatushistorydata",
    );
    const historyID = Number(idRows[0]?.nextID) || 1;
    const remark = `Shiprocket Order Created | Shipment ID: ${shipmentId}${awbCode ? " | AWB: " + awbCode : ""}${courierName ? " | Courier: " + courierName : ""}`;

    await query(
      db,
      `INSERT INTO mst_customerorderstatushistorydata
       (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [historyID, OrderNo, newStatus, remark, "Shiprocket API"],
    );

    return res.json({
      success: true,
      message: `Shiprocket order created successfully! Shipment ID: ${shipmentId || "Generated"}`,
      data: {
        OrderNo,
        OrderStatus: newStatus,
        shipment_id: shipmentId,
        awb_code: awbCode,
        courier_name: courierName,
      },
    });
  } catch (error) {
    console.error("Create Shiprocket order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order on Shiprocket.",
    });
  }
};

exports.syncShiprocketOrders = async (req, res) => {
  try {
    const shiprocketOrders = await shiprocketService.getShiprocketOrders(15);
    let updatedCount = 0;

    for (const sOrder of shiprocketOrders) {
      const orderNo = Number(sOrder.order_no);
      if (!orderNo || isNaN(orderNo)) continue;

      const currentRows = await query(
        db,
        "SELECT OrderStatus FROM mst_customerorderdata WHERE OrderNo = ? LIMIT 1",
        [orderNo],
      );

      if (currentRows.length) {
        const currentStatus = currentRows[0].OrderStatus;
        const newStatus = sOrder.status;

        if (newStatus && currentStatus !== newStatus) {
          await query(
            db,
            `UPDATE mst_customerorderdata
             SET OrderStatus = ?, UpdatedBy = ?, UpdatedOn = NOW(),
                 DeliveryDate = CASE WHEN ? = 'Delivered' AND DeliveryDate IS NULL THEN NOW() ELSE DeliveryDate END
             WHERE OrderNo = ?`,
            [newStatus, "Shiprocket Sync", newStatus, orderNo],
          );

          const idRows = await query(
            db,
            "SELECT COALESCE(MAX(CustomerOrderStatusHistoryID), 0) + 1 AS nextID FROM mst_customerorderstatushistorydata",
          );
          const historyID = Number(idRows[0]?.nextID) || 1;
          const remark = `Shiprocket Sync | Status: ${newStatus} | Raw: ${sOrder.raw_status}${sOrder.shipment_id ? " | Shipment: " + sOrder.shipment_id : ""}${sOrder.awb_code ? " | AWB: " + sOrder.awb_code : ""}`;

          await query(
            db,
            `INSERT INTO mst_customerorderstatushistorydata
             (CustomerOrderStatusHistoryID, OrderNo, OrderStatus, Remarks, UpdatedBy, UpdatedOn)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [historyID, orderNo, newStatus, remark, "Shiprocket Sync"],
          );

          updatedCount++;
        }
      }
    }

    return res.json({
      success: true,
      message: `Shiprocket sync complete. Updated ${updatedCount} orders.`,
      updatedCount,
      totalFetched: shiprocketOrders.length,
    });
  } catch (error) {
    console.error("Sync Shiprocket orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync orders with Shiprocket.",
    });
  }
};

exports.trackShiprocketOrder = async (req, res) => {
  const OrderNo = Number(req.params.OrderNo);
  if (!validID(OrderNo)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order number." });
  }
  try {
    const tracking = await shiprocketService.trackShiprocketOrder(OrderNo);
    return res.json({ success: true, data: tracking });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve tracking details.",
    });
  }
};
