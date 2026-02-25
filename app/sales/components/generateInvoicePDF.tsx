import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SaleData {
  saleId?: string;
  saleDate: string | Date;
  paymentTerms?: string;
  sellerEIN?: string;
  product: string;
  client: string;
  weightOut: number;
  pieces: number;
  price: number;
  freightCharge?: number;
  fuelSurcharge?: number;
  previousBalance?: number;
  credits?: number;
  bankName?: string;
  routing?: string;
  account?: string;
  notes?: string;
  lotId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseDueDateFromTerms(saleDate: Date, paymentTerms?: string): Date {
  const termDays = paymentTerms
    ? parseInt(paymentTerms.replace(/\D/g, ""), 10) || 0
    : 0;
  const due = new Date(saleDate);
  due.setDate(due.getDate() + termDays);
  return due;
}

function buildTableBody(
  sale: SaleData,
  freight: number,
  fuel: number,
): string[][] {
  const rows: string[][] = [
    [
      sale.product,
      sale.weightOut.toString(),
      sale.pieces.toString(),
      (sale.price / sale.pieces).toFixed(2),
      `$${sale.price.toFixed(2)}`,
    ],
  ];
  if (freight > 0)
    rows.push(["Freight / Delivery", "—", "—", "—", `$${freight.toFixed(2)}`]);
  if (fuel > 0)
    rows.push(["Fuel Surcharge", "—", "—", "—", `$${fuel.toFixed(2)}`]);
  return rows;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, sale: SaleData, invoiceNumber: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const saleDate = new Date(sale.saleDate);
  const dueDate = parseDueDateFromTerms(saleDate, sale.paymentTerms);
  const termDays = sale.paymentTerms
    ? parseInt(sale.paymentTerms.replace(/\D/g, ""), 10) || 0
    : 0;

  // Logo
  doc.addImage("/logo.png", "PNG", 20, 12, 25, 18);
  doc.setTextColor(0);

  // Company name + subtitle
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Farm 2 Markets", 50, 22);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("OUTBOUND INVOICE", 50, 30);

  if (sale.sellerEIN) {
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`EIN: ${sale.sellerEIN}`, 50, 37);
    doc.setTextColor(0);
  }

  // Top-right meta block
  const metaX = pageWidth - 20;
  let metaY = 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice #: ${invoiceNumber}`, metaX, metaY, { align: "right" });

  metaY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Sale Date: ${formatDate(saleDate)}`, metaX, metaY, { align: "right" });

  if (sale.paymentTerms) {
    metaY += 6;
    doc.text(`Payment Terms: ${sale.paymentTerms}`, metaX, metaY, { align: "right" });
  }
  if (termDays > 0) {
    metaY += 6;
    doc.text(`Due Date: ${formatDate(dueDate)}`, metaX, metaY, { align: "right" });
  }

  // Divider
  doc.setDrawColor(200);
  doc.line(20, 42, pageWidth - 20, 42);
}

function drawInvoiceDetails(doc: jsPDF, sale: SaleData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const metaX = pageWidth - 20;
  let leftY = 52;
  let rightY = 52;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", 20, leftY);

  doc.setFont("helvetica", "normal");
  leftY += 8;
  doc.setFontSize(10);
  doc.text(`Product: ${sale.product}`, 20, leftY);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", metaX, rightY, { align: "right" });

  doc.setFont("helvetica", "normal");
  rightY += 8;
  doc.setFontSize(10);
  doc.text(`Client: ${sale.client}`, metaX, rightY, { align: "right" });
}

function drawProductTable(doc: jsPDF, sale: SaleData, freight: number, fuel: number) {
  autoTable(doc, {
    startY: 78,
    head: [["Description", "Weight Out (lb)", "Pieces", "Unit Price ($)", "Amount ($)"]],
    body: buildTableBody(sale, freight, fuel),
    theme: "grid",
    headStyles: { fillColor: [30, 120, 60], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10 },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index > 0) {
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.textColor = [80, 80, 80];
        data.cell.styles.fontStyle = "italic";
      }
    },
  });
}

function drawAccountSummary(
  doc: jsPDF,
  sale: SaleData,
  afterTableY: number,
  grandTotal: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const previousBalance = sale.previousBalance ?? 0;
  const credits = sale.credits ?? 0;
  const colLabel = pageWidth - 90;
  const colValue = pageWidth - 20;
  const summaryStartY = afterTableY + 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Account Summary", 20, summaryStartY);

  const summaryRows: [string, number][] = [
    ["Previous Balance:", previousBalance],
    ["Payments / Credits:", credits],
    ["Current Charges:", grandTotal],
  ];

  let sumY = summaryStartY + 7;
  doc.setFontSize(10);

  summaryRows.forEach(([label, amount]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, colLabel, sumY, { align: "left" });

    const isCredit = label.startsWith("Payments");
    if (isCredit) doc.setTextColor(30, 120, 60);
    doc.text(
      isCredit ? `- $${amount.toFixed(2)}` : `$${amount.toFixed(2)}`,
      colValue,
      sumY,
      { align: "right" },
    );
    if (isCredit) doc.setTextColor(0);
    sumY += 7;
  });

  // Divider above total
  doc.setDrawColor(180);
  doc.line(colLabel, sumY - 2, pageWidth - 20, sumY - 2);

  // Total due
  const totalDue = previousBalance - credits + grandTotal;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount Due:", colLabel, sumY + 6, { align: "left" });
  doc.text(`$${totalDue.toFixed(2)}`, colValue, sumY + 6, { align: "right" });

  // Late fee notice
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  doc.text(
    "A 1.5% monthly interest charge will be applied to all past-due balances.",
    colLabel,
    sumY + 13,
    { align: "left" },
  );
  doc.setTextColor(0);

  // Notes (positioned relative to summary)
  if (sale.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Note: ${sale.notes}`, 20, sumY + 6);
    doc.setTextColor(0);
  }
}

function drawFooter(doc: jsPDF, sale: SaleData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const bankingLines = [sale.bankName, sale.routing, sale.account].filter(Boolean).length;
  const bankingBlockHeight = bankingLines > 0 ? 8 + bankingLines * 5.5 : 0;
  const footerContentHeight = 27 + bankingBlockHeight + 12;
  const footerTop = pageHeight - footerContentHeight - 14;

  doc.setDrawColor(200);
  doc.line(20, footerTop, pageWidth - 20, footerTop);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Remit Payment To:", 20, footerTop + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Farm 2 Markets", 20, footerTop + 13);
  doc.text("[Street Address], [City, State ZIP]", 20, footerTop + 19);

  // ACH / Wire block
  if (sale.bankName || sale.routing || sale.account) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("ACH / Wire Transfer:", 20, footerTop + 27);
    doc.setFont("helvetica", "normal");

    let bankLineY = footerTop + 33;
    if (sale.bankName) { doc.text(`Bank: ${sale.bankName}`, 20, bankLineY); bankLineY += 5.5; }
    if (sale.routing) { doc.text(`Routing: ${sale.routing}`, 20, bankLineY); bankLineY += 5.5; }
    if (sale.account) { doc.text(`Account: ${sale.account}`, 20, bankLineY); }
  }

  // P&S Act trust statement
  const psText =
    "The livestock/meat products described herein are sold subject to the statutory trust authorized by " +
    "Section 206 of the Packers and Stockyards Act, 1921 (7 U.S.C. 196).";
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(110, 110, 110);
  doc.text(doc.splitTextToSize(psText, pageWidth - 40), pageWidth / 2, pageHeight - 8, {
    align: "center",
  });
  doc.setTextColor(0);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateInvoicePDF(sale: SaleData): void {
  const doc = new jsPDF();

  const invoiceNumber = sale.saleId ? `INV-${sale.saleId}` : `INV-${Date.now()}`;
  const freight = sale.freightCharge ?? 0;
  const fuel = sale.fuelSurcharge ?? 0;
  const grandTotal = sale.price + freight + fuel;

  drawHeader(doc, sale, invoiceNumber);
  drawInvoiceDetails(doc, sale);
  drawProductTable(doc, sale, freight, fuel);

  const afterTableY: number = (doc as any).lastAutoTable?.finalY ?? 78;

  drawAccountSummary(doc, sale, afterTableY, grandTotal);
  drawFooter(doc, sale);

  doc.save(`Invoice_${invoiceNumber}_${sale.lotId ?? "unknown"}.pdf`);
}