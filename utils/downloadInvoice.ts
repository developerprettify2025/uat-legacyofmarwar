const LETTERHEAD_URL = "/letterhead.jpg"; // public/letterhead.jpg

// ---------- business config ----------
const BUSINESS_NAME = "ANAAYAH CREATIVES & DESIGNS";
const HSN_CODE = "711311";
const SELLER_STATE_CODE = "07"; // seller Delhi ka hai

const GST_RATE = 0.03; // 3% (price me already included)
const GST_DIVISOR = 1 + GST_RATE; // 1.03

// ---------- GST state codes ----------
const STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "dadra and nagar haveli and daman and diu": "26",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

// alag-alag spelling / purane naam bhi chalenge
const STATE_ALIASES: Record<string, string> = {
  "new delhi": "delhi",
  "nct of delhi": "delhi",
  "delhi ncr": "delhi",
  orissa: "odisha",
  uttaranchal: "uttarakhand",
  pondicherry: "puducherry",
  "jammu and kashmir": "jammu and kashmir",
  "j and k": "jammu and kashmir",
  "dadra and nagar haveli": "dadra and nagar haveli and daman and diu",
  "daman and diu": "dadra and nagar haveli and daman and diu",
  "andaman and nicobar": "andaman and nicobar islands",
  "andaman nicobar islands": "andaman and nicobar islands",
  "chattisgarh": "chhattisgarh",
};

const normalizeState = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// state ke naam se GST state code nikalo, na mile to "" return hoga
const getStateCode = (state?: string | null): string => {
  if (!state) return "";
  const key = normalizeState(state);
  const name = STATE_ALIASES[key] ?? key;
  return STATE_CODES[name] ?? "";
};

// 2 decimal tak round
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// jsPDF ke default font me ₹ symbol nahi hota, isliye "Rs." use kiya hai
const rs = (n: any) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (v?: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

// letterhead ko base64 me load karo (ek baar cache hota hai)
let letterheadCache: string | null = null;
async function loadLetterhead(): Promise<string> {
  if (letterheadCache) return letterheadCache;
  const res = await fetch(LETTERHEAD_URL);
  const blob = await res.blob();
  letterheadCache = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return letterheadCache;
}

export async function downloadInvoice(order: any) {
  // dynamic import: server render me error nahi aata
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const letterhead = await loadLetterhead();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40; // left/right margin
  const TOP = 110; // logo ke neeche se content shuru
  const BOTTOM = 95; // footer (contact details) ke upar tak content
  const gold: [number, number, number] = [154, 124, 71];

  const drawLetterhead = () => {
    doc.addImage(letterhead, "JPG", 0, 0, pageW, pageH, undefined, "FAST");
  };

  // page 1 ka background
  drawLetterhead();

  // ---------- state / tax type ----------
  const buyerState = String(order.OrderShippingAddressState || "").trim();
  const buyerStateCode = getStateCode(buyerState);
  // buyer Delhi (07) ka ho to CGST + SGST, warna IGST
  const isIntraState = buyerStateCode
    ? buyerStateCode === SELLER_STATE_CODE
    : buyerState.toLowerCase().includes("delhi");
  const taxHead = isIntraState ? "GST" : "IGST";

  // ---------- calculation ----------
  const rawItems: any[] = order.items ?? [];

  const items = rawItems.map((it) => {
    const lineTotal = r2(Number(it.ProductTotalAmount || 0)); // GST included
    const lineBase = r2(lineTotal / GST_DIVISOR);
    return {
      ...it,
      unitBase: r2(Number(it.ProductSalePrice || 0) / GST_DIVISOR),
      lineBase,
      lineTax: r2(lineTotal - lineBase),
      lineTotal,
    };
  });

  const subTotal = r2(items.reduce((s, i) => s + i.lineBase, 0));
  const itemsInclusive = r2(items.reduce((s, i) => s + i.lineTotal, 0));

  // coupon bhi tax-inclusive hai
  const coupon = Number(order.CouponValue || 0);
  const couponBase = r2(coupon / GST_DIVISOR);

  const taxable = r2(subTotal - couponBase);
  // tax = (inclusive total - taxable), isse invoice hamesha exact add hota hai
  const totalTax = r2(itemsInclusive - coupon - taxable);
  const sgst = r2(totalTax / 2);
  const cgst = r2(totalTax - sgst);

  const shipping = Number(order.TotalShippingAmount || 0);
  const exactTotal = r2(taxable + totalTax + shipping);
  const grandTotal = Math.round(exactTotal); // nearest whole rupee
  const roundOff = r2(grandTotal - exactTotal);

  // ---------- header (logo letterhead me hai) ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text("TAX INVOICE", pageW - M, 60, { align: "right" });

  doc.setFontSize(9);
  doc.text(BUSINESS_NAME, pageW - M, 78, { align: "right" });

  // ---------- invoice info (left) ----------
  doc.setFontSize(10);
  const placeOfSupply = buyerState
    ? `${buyerState}${buyerStateCode ? ` (State Code ${buyerStateCode})` : ""}`
    : "-";

  const info: [string, string][] = [
    ["Invoice No:", String(order.InvoiceNo ?? order.OrderNo ?? "-")],
    ["Invoice Date:", fmtDate(order.OrderDate)],
    ["Order No:", String(order.OrderNo ?? "-")],
    ["Txn ID:", String(order.TransactionID || "-")],
    ["Payment:", String(order.TransactionStatus || "-")],
    ["Place of Supply:", placeOfSupply],
    ["Reverse Charge:", "No"],
  ];
  let y = 124;
  info.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    doc.text(k, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70);
    doc.text(v, M + 90, y);
    y += 15;
  });

  // ---------- bill to (right) ----------
  const addr =
    [
      order.OrderShippingAddressFullAddress,
      order.OrderShippingAddressLocality,
      order.OrderShippingAddressCity,
      order.OrderShippingAddressState,
    ]
      .filter(Boolean)
      .join(", ") +
    (order.OrderShippingAddressPinCode
      ? ` - ${order.OrderShippingAddressPinCode}`
      : "");

  const rightX = pageW / 2 + 20;
  let ry = 124;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("Bill To", rightX, ry);
  ry += 15;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);
  doc.text(String(order.OrderShippingAddressName || ""), rightX, ry);
  ry += 13;

  const addrLines: string[] = doc.splitTextToSize(addr, pageW - M - rightX);
  addrLines.forEach((l) => {
    doc.text(l, rightX, ry);
    ry += 13;
  });

  doc.text(
    `State: ${buyerState || "-"}${buyerStateCode ? `    State Code: ${buyerStateCode}` : ""}`,
    rightX,
    ry,
  );
  ry += 13;

  doc.text(
    `GSTIN: ${order.CustomerGSTIN || order.OrderShippingAddressGSTIN || "Unregistered"}`,
    rightX,
    ry,
  );
  ry += 13;

  doc.text("Delivery Address: Same as above", rightX, ry);
  ry += 13;

  if (order.OrderShippingAddressPhoneNo) {
    doc.text(`Mobile: ${order.OrderShippingAddressPhoneNo}`, rightX, ry);
    ry += 13;
  }

  // ---------- items table ----------
  const colAlign = ["left", "left", "left", "left", "center", "center", "right"];

  autoTable(doc, {
    startY: Math.max(y, ry) + 8,
    margin: { left: M, right: M, top: TOP, bottom: BOTTOM },
    head: [
      ["#", "Product", "HSN", "Qty", "Price (excl. GST)", `${taxHead} @ 3%`, "Amount"],
    ],
    body: items.map((it, i) => [
      i + 1,
      it.ProductName,
      HSN_CODE,
      `${it.ProductQuantity} PCS`,
      rs(it.unitBase),
      rs(it.lineTax),
      rs(it.lineTotal),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: 50 },
    headStyles: { fillColor: gold, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { cellWidth: 50 },
      3: { cellWidth: 45 },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "right" },
    },
    // header ko bhi column ki alignment ke hisaab se set karo
    didParseCell: (data: any) => {
      if (data.section === "head") {
        data.cell.styles.halign = colAlign[data.column.index];
      }
    },
    // table agar dusre page par jaye to wahan bhi letterhead lage
    willDrawPage: (data: any) => {
      if (data.pageNumber > 1) drawLetterhead();
    },
  });

  // ---------- summary ----------
  let sy = (doc as any).lastAutoTable.finalY + 24;

  // summary ke liye jagah kam ho to nayi page (letterhead ke saath)
  const summaryHeight = 170;
  if (sy + summaryHeight > pageH - BOTTOM) {
    doc.addPage();
    drawLetterhead();
    sy = TOP + 10;
  }

  const labelX = pageW - M - 220;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 30 : 70);
    doc.text(label, labelX, sy);
    doc.text(value, pageW - M, sy, { align: "right" });
    sy += bold ? 20 : 16;
  };

  line("Subtotal (excl. GST)", rs(subTotal));
  if (coupon > 0) {
    line(
      `Coupon${order.CouponCode ? ` (${order.CouponCode})` : ""}`,
      `- ${rs(couponBase)}`,
    );
    line("Taxable Amount", rs(taxable));
  }
  if (isIntraState) {
    line("SGST (1.5%)", rs(sgst));
    line("CGST (1.5%)", rs(cgst));
  } else {
    line("IGST (3%)", rs(totalTax));
  }
  line("Shipping", shipping > 0 ? rs(shipping) : "Free");
  if (roundOff !== 0) {
    line("Round Off", `${roundOff > 0 ? "+" : "-"} ${rs(Math.abs(roundOff))}`);
  }

  doc.setDrawColor(200);
  doc.line(labelX, sy - 8, pageW - M, sy - 8);
  sy += 4;
  line("Total Amount", `Rs. ${grandTotal.toLocaleString("en-IN")}`, true);

  // ---------- note (footer ke upar, letterhead ke contact details se alag) ----------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    "This is a computer generated invoice and does not require a signature.",
    pageW / 2,
    pageH - BOTTOM + 12,
    { align: "center" },
  );

  doc.save(`Invoice-${order.OrderNo}.pdf`);
}