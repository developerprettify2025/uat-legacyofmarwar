const LETTERHEAD_URL = "/letterhead.jpg"; // public/letterhead.jpg

const GST_DIVISOR = 1.03; // price me 3% GST included hai
const SGST_RATE = 0.015; // 1.5%
const CGST_RATE = 0.015; // 1.5%

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

  // ---------- calculation ----------
  const rawItems: any[] = order.items ?? [];

  // har product ki price me se GST nikalo: base = price / 1.03
  const items = rawItems.map((it) => ({
    ...it,
    unitBase: r2(Number(it.ProductSalePrice || 0) / GST_DIVISOR),
    totalBase: r2(Number(it.ProductTotalAmount || 0) / GST_DIVISOR),
  }));

  const subTotal = r2(items.reduce((s, i) => s + i.totalBase, 0));

  // coupon bhi tax-inclusive hai, isliye usse bhi base me convert karo
  const coupon = Number(order.CouponValue || 0);
  const couponBase = r2(coupon / GST_DIVISOR);

  const taxable = r2(subTotal - couponBase);
  const sgst = r2(taxable * SGST_RATE);
  const cgst = r2(taxable * CGST_RATE);

  const shipping = Number(order.TotalShippingAmount || 0);
  const exactTotal = r2(taxable + sgst + cgst + shipping);
  const grandTotal = Math.round(exactTotal); // nearest whole rupee
  const roundOff = r2(grandTotal - exactTotal); // can be + or -

  // ---------- header (logo letterhead me hai, sirf INVOICE title) ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text("INVOICE", pageW - M, 60, { align: "right" });

  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(M, 100, pageW - M, 100);

  // ---------- order info (left) ----------
  doc.setFontSize(10);
  const info: [string, string][] = [
    ["Order No", String(order.OrderNo ?? "-")],
    ["Order Date", fmtDate(order.OrderDate)],
    ["Txn ID", String(order.TransactionID || "-")],
    ["Payment", String(order.TransactionStatus || "-")],
  ];
  let y = 130;
  info.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    doc.text(`${k}:`, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70);
    doc.text(v, M + 75, y);
    y += 16;
  });

  // ---------- ship to (right) ----------
  const addr = [
    order.OrderShippingAddressFullAddress,
    order.OrderShippingAddressLocality,
    [order.OrderShippingAddressCity, order.OrderShippingAddressState]
      .filter(Boolean)
      .join(", "),
    order.OrderShippingAddressPinCode,
  ]
    .filter(Boolean)
    .join(", ");

  const rightX = pageW / 2 + 20;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text("Bill To", rightX, 130);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);
  doc.text(String(order.OrderShippingAddressName || ""), rightX, 146);
  const addrLines = doc.splitTextToSize(addr, pageW - M - rightX);
  doc.text(addrLines, rightX, 160);
  const phoneY = 160 + addrLines.length * 12 + 4;
  if (order.OrderShippingAddressPhoneNo) {
    doc.text(`Mobile: ${order.OrderShippingAddressPhoneNo}`, rightX, phoneY);
  }

  // ---------- items table (GST nikalne ke baad ki price) ----------
  autoTable(doc, {
    startY: Math.max(y, phoneY) + 20,
    margin: { left: M, right: M, top: TOP, bottom: BOTTOM },
    head: [["#", "Product", "Price (excl. GST)", "Qty", "Amount"]],
    body: items.map((it, i) => [
      i + 1,
      it.ColorName ? `${it.ProductName}\nColor: ${it.ColorName}` : it.ProductName,
      rs(it.unitBase),
      it.ProductQuantity,
      rs(it.totalBase),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: 50 },
    headStyles: { fillColor: gold, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: "right" },
      3: { halign: "center", cellWidth: 40 },
      4: { halign: "right" },
    },
    // table agar dusre page par jaye to wahan bhi letterhead lage
    willDrawPage: (data: any) => {
      if (data.pageNumber > 1) drawLetterhead();
    },
  });

  // ---------- summary ----------
  let sy = (doc as any).lastAutoTable.finalY + 24;

  // summary ke liye jagah kam ho to nayi page (letterhead ke saath)
  const summaryHeight = 160;
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
  line("SGST (1.5%)", rs(sgst));
  line("CGST (1.5%)", rs(cgst));
  line("Shipping", shipping > 0 ? rs(shipping) : "Free");

  doc.setDrawColor(200);
  doc.line(labelX, sy - 8, pageW - M, sy - 8);
  sy += 4;
  line(
    "Total Amount",
    `Rs. ${grandTotal.toLocaleString("en-IN")}`,
    true,
  );

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