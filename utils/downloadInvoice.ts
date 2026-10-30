const COMPANY = {
  name: "Legacy of Marwar",
  tagline: "Pure . Timeless",
  gstin: "", // apna GSTIN yahan likho, khali ho to invoice me nahi dikhega
};

// jsPDF ke default font me ₹ symbol nahi hota, isliye "Rs." use kiya hai
const rs = (n: any) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

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

export async function downloadInvoice(order: any) {
  // dynamic import: server render me error nahi aata
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 40; // margin
  const gold: [number, number, number] = [154, 124, 71];

  const items: any[] = order.items ?? [];
  const subTotal = items.reduce(
    (s, i) => s + Number(i.ProductTotalAmount || 0),
    0,
  );
  const coupon = Number(order.CouponValue || 0);
  const shipping = Number(order.TotalShippingAmount || 0);
  const gst = Number(order.TotalGSTAmount || 0);

  // ---------- header ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...gold);
  doc.text(COMPANY.name, M, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(COMPANY.tagline, M, 70);
  if (COMPANY.gstin) doc.text(`GSTIN: ${COMPANY.gstin}`, M, 83);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.text("INVOICE", pageW - M, 55, { align: "right" });

  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(M, 95, pageW - M, 95);

  // ---------- order info (left) ----------
  doc.setFontSize(10);
  const info: [string, string][] = [
    ["Order No", String(order.OrderNo ?? "-")],
    ["Order Date", fmtDate(order.OrderDate)],
    ["Txn ID", String(order.TransactionID || "-")],
    ["Payment", String(order.TransactionStatus || "-")],
  ];
  let y = 120;
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
  doc.text("Ship To", rightX, 120);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70);
  doc.text(String(order.OrderShippingAddressName || ""), rightX, 136);
  const addrLines = doc.splitTextToSize(addr, pageW - M - rightX);
  doc.text(addrLines, rightX, 150);
  const phoneY = 150 + addrLines.length * 12 + 4;
  if (order.OrderShippingAddressPhoneNo) {
    doc.text(`Mobile: ${order.OrderShippingAddressPhoneNo}`, rightX, phoneY);
  }

  // ---------- items table ----------
  autoTable(doc, {
    startY: Math.max(y, phoneY) + 20,
    margin: { left: M, right: M },
    head: [["#", "Product", "Price", "Qty", "Total"]],
    body: items.map((it, i) => [
      i + 1,
      it.ColorName ? `${it.ProductName}\nColor: ${it.ColorName}` : it.ProductName,
      rs(it.ProductSalePrice),
      it.ProductQuantity,
      rs(it.ProductTotalAmount),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: 50 },
    headStyles: { fillColor: gold, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: "right" },
      3: { halign: "center", cellWidth: 40 },
      4: { halign: "right" },
    },
  });

  // ---------- summary ----------
  let sy = (doc as any).lastAutoTable.finalY + 24;
  const labelX = pageW - M - 190;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 30 : 70);
    doc.text(label, labelX, sy);
    doc.text(value, pageW - M, sy, { align: "right" });
    sy += bold ? 20 : 16;
  };

  line("Subtotal", rs(subTotal));
  if (coupon > 0) {
    line(
      `Coupon${order.CouponCode ? ` (${order.CouponCode})` : ""}`,
      `- ${rs(coupon)}`,
    );
  }
  line("Shipping", shipping > 0 ? rs(shipping) : "Free");

  doc.setDrawColor(200);
  doc.line(labelX, sy - 8, pageW - M, sy - 8);
  sy += 4;
  line("Total Amount", rs(order.OrderTotalAmount), true);

  if (gst > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`(Includes GST of ${rs(gst)})`, pageW - M, sy - 4, {
      align: "right",
    });
  }

  // ---------- footer ----------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    "This is a computer generated invoice and does not require a signature.",
    pageW / 2,
    doc.internal.pageSize.getHeight() - 30,
    { align: "center" },
  );

  doc.save(`Invoice-${order.OrderNo}.pdf`);
}