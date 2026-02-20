import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleWithProduct } from "../types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";
interface SalesCardProps {
  sale: SaleWithProduct;
}

export function SalesCard({ sale }: SalesCardProps) {
  const handlePrintInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Helpers ──────────────────────────────────────────────────────────────
    const saleDate = new Date(sale.saleDate);

    // Due date = saleDate + N days derived from paymentTerms (e.g. "Net 15" → 15)
    const termDays = sale.paymentTerms
      ? parseInt(sale.paymentTerms.replace(/\D/g, ""), 10) || 0
      : 0;
    const dueDate = new Date(saleDate);
    dueDate.setDate(dueDate.getDate() + termDays);

    // Invoice # from saleId or fallback to timestamp
    const invoiceNumber = sale.saleId
      ? `INV-${sale.saleId}`
      : `INV-${Date.now()}`;

    // Balance section figures
    const previousBalance = sale.previousBalance ?? 0;
    const credits = sale.credits ?? 0;
    // ── LOGO ─────────────────────────────────────────────────────────────────
    doc.setFillColor(30, 120, 60);
    doc.rect(20, 12, 25, 18, "F");
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HF", 32.5, 23, { align: "center" });
    doc.setTextColor(0);

    // ── COMPANY NAME + SUBTITLE ───────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HALAL FARMS", 50, 22);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("OUTBOUND INVOICE", 50, 30);

    // Seller EIN directly under company name
    if (sale.sellerEIN) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(`EIN: ${sale.sellerEIN}`, 50, 37);
      doc.setTextColor(0);
    }

    // ── TOP-RIGHT: Invoice meta block ─────────────────────────────────────────
    const metaX = pageWidth - 20;
    let metaY = 15;
    doc.setFontSize(10);

    doc.setFont("helvetica", "bold");
    doc.text(`Invoice #: ${invoiceNumber}`, metaX, metaY, { align: "right" });

    metaY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Sale Date: ${formatDate(saleDate)}`, metaX, metaY, {
      align: "right",
    });

    if (sale.paymentTerms) {
      metaY += 6;
      doc.text(`Payment Terms: ${sale.paymentTerms}`, metaX, metaY, {
        align: "right",
      });
    }

    if (termDays > 0) {
      metaY += 6;
      doc.text(`Due Date: ${formatDate(dueDate)}`, metaX, metaY, {
        align: "right",
      });
    }

    // ── DIVIDER ───────────────────────────────────────────────────────────────
    doc.setDrawColor(200);
    doc.line(20, 42, pageWidth - 20, 42);

    // ── INVOICE DETAILS (left) + BILL TO (right) ──────────────────────────────
    let leftY = 52;
    let rightY = 52;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 20, leftY);

    doc.setFont("helvetica", "normal");
    leftY += 8;
    doc.setFontSize(10);
    doc.text(`Product: ${sale.product}`, 20, leftY);
    leftY += 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", metaX, rightY, { align: "right" });

    doc.setFont("helvetica", "normal");
    rightY += 8;
    doc.setFontSize(10);
    doc.text(`Client: ${sale.client}`, metaX, rightY, { align: "right" });

    // ── PRODUCT TABLE ─────────────────────────────────────────────────────────
    const freight = sale.freightCharge ?? 0;
    const fuel = sale.fuelSurcharge ?? 0;
    const grandTotal = sale.price + freight + fuel;

    const tableBody: string[][] = [
      [
        sale.product,
        sale.weightOut.toString(),
        sale.pieces.toString(),
        (sale.price / sale.pieces).toFixed(2),
        `$${sale.price.toFixed(2)}`,
      ],
    ];

    if (freight > 0) {
      tableBody.push([
        "Freight / Delivery",
        "—",
        "—",
        "—",
        `$${freight.toFixed(2)}`,
      ]);
    }
    if (fuel > 0) {
      tableBody.push(["Fuel Surcharge", "—", "—", "—", `$${fuel.toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: 78,
      head: [
        [
          "Description",
          "Weight Out (lb)",
          "Pieces",
          "Unit Price ($)",
          "Amount ($)",
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [30, 120, 60],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index > 0) {
          data.cell.styles.fillColor = [245, 245, 245];
          data.cell.styles.textColor = [80, 80, 80];
          data.cell.styles.fontStyle = "italic";
        }
      },
    });

    const afterTableY: number = (doc as any).lastAutoTable?.finalY ?? 78;

    // ── BALANCE SUMMARY SECTION ───────────────────────────────────────────────
    const summaryStartY = afterTableY + 10;
    const colLabel = pageWidth - 90;
    const colValue = pageWidth - 20;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Account Summary", 20, summaryStartY);

    const summaryRows: [string, number][] = [
      ["Previous Balance:", previousBalance],
      ["Payments / Credits:", credits],
      ["Current Charges:", grandTotal], // ← now includes freight + fuel
    ];

    let sumY = summaryStartY + 7;
    doc.setFontSize(10);

    summaryRows.forEach(([label, amount]) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, colLabel, sumY, { align: "left" });
      if (label.startsWith("Payments")) {
        doc.setTextColor(30, 120, 60);
        doc.text(`- $${amount.toFixed(2)}`, colValue, sumY, { align: "right" });
        doc.setTextColor(0);
      } else {
        doc.text(`$${amount.toFixed(2)}`, colValue, sumY, { align: "right" });
      }
      sumY += 7;
    });

    // Divider above total due
    doc.setDrawColor(180);
    doc.line(colLabel, sumY - 2, pageWidth - 20, sumY - 2);

    // Total Amount Due — uses grandTotal
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

    // ── NOTES ─────────────────────────────────────────────────────────────────
    if (sale.notes) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Note: ${sale.notes}`, 20, sumY + 6);
      doc.setTextColor(0);
    }

    // ── REMIT TO / BANKING FOOTER ─────────────────────────────────────────────
    const bankingLines = [sale.bankName, sale.routing, sale.account].filter(
      Boolean,
    ).length;
    const bankingBlockHeight = bankingLines > 0 ? 8 + bankingLines * 5.5 : 0; // "ACH" label + lines
    const footerContentHeight = 27 + bankingBlockHeight + 12; // remit header + address + banking + padding
    const footerTop = pageHeight - footerContentHeight - 14; // 14 = P&S statement height reserve
    doc.setDrawColor(200);
    doc.line(20, footerTop, pageWidth - 20, footerTop);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Remit Payment To:", 20, footerTop + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("HALAL FARMS", 20, footerTop + 13);
    doc.text("[Street Address], [City, State ZIP]", 20, footerTop + 19);

    // ACH / Wire block
    if (sale.bankName || sale.routing || sale.account) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("ACH / Wire Transfer:", 20, footerTop + 27);
      doc.setFont("helvetica", "normal");

      let bankLineY = footerTop + 33;
      if (sale.bankName) {
        doc.text(`Bank: ${sale.bankName}`, 20, bankLineY);
        bankLineY += 5.5;
      }
      if (sale.routing) {
        doc.text(`Routing: ${sale.routing}`, 20, bankLineY);
        bankLineY += 5.5;
      }
      if (sale.account) {
        doc.text(`Account: ${sale.account}`, 20, bankLineY);
      }
    }

    // ── P&S ACT TRUST STATEMENT ───────────────────────────────────────────────
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(110, 110, 110);
    const psText =
      "The livestock/meat products described herein are sold subject to the statutory trust authorized by " +
      "Section 206 of the Packers and Stockyards Act, 1921 (7 U.S.C. 196).";
    const splitPs = doc.splitTextToSize(psText, pageWidth - 40);
    doc.text(splitPs, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.setTextColor(0);

    // ── SAVE ──────────────────────────────────────────────────────────────────
    doc.save(`Invoice_${invoiceNumber}_${sale.lotId}.pdf`);
  };

  return (
    <Card key={sale.id}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {sale.product}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Lot: {sale.lotId}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="destructive">Sold</Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handlePrintInvoice}
                  className="cursor-pointer"
                  variant="outline"
                  size="sm"
                >
                  🖨️
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Invoice</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Core sale info */}
        <div className="grid grid-cols-4 gap-2 text-sm mb-3">
          <div>
            <p className="text-red-500 font-medium">Weight Out</p>
            <p className="font-semibold text-red-500">{sale.weightOut} lb</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Pieces</p>
            <p className="font-semibold text-foreground">{sale.pieces} pcs</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Client Name</p>
            <p className="font-semibold text-foreground">{sale.client}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Date</p>
            <p className="font-semibold text-foreground">
              {formatDate(new Date(sale.saleDate))}
            </p>
          </div>
        </div>

        {/* Price + Payment Terms */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground font-medium">
              Proposed Sales Price
            </p>
            <p className="font-semibold text-foreground">{sale.price} $</p>
          </div>
          {sale.paymentTerms && (
            <div>
              <p className="text-muted-foreground font-medium">Payment Terms</p>
              <p className="font-semibold text-foreground">
                {sale.paymentTerms}
              </p>
            </div>
          )}
          {/* Surcharges */}
          {((sale.freightCharge != null && sale.freightCharge > 0) ||
            (sale.fuelSurcharge != null && sale.fuelSurcharge > 0)) && (
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {sale.freightCharge != null && sale.freightCharge > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium">
                    Freight / Delivery
                  </p>
                  <p className="font-semibold text-foreground">
                    ${sale.freightCharge.toFixed(2)}
                  </p>
                </div>
              )}
              {sale.fuelSurcharge != null && sale.fuelSurcharge > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium">
                    Fuel Surcharge
                  </p>
                  <p className="font-semibold text-foreground">
                    ${sale.fuelSurcharge.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previous Balance + Credits */}
        {(sale.previousBalance != null || sale.credits != null) && (
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            {sale.previousBalance != null && (
              <div>
                <p className="text-muted-foreground font-medium">
                  Previous Balance
                </p>
                <p className="font-semibold text-foreground">
                  ${sale.previousBalance.toFixed(2)}
                </p>
              </div>
            )}
            {sale.credits != null && (
              <div>
                <p className="text-muted-foreground font-medium">Credits</p>
                <p className="font-semibold text-green-600">
                  ${sale.credits.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seller EIN */}
        {sale.sellerEIN && (
          <div className="text-sm mb-3">
            <p className="text-muted-foreground font-medium">Seller EIN</p>
            <p className="font-semibold text-foreground font-mono">
              {sale.sellerEIN}
            </p>
          </div>
        )}

        {/* Banking Info */}
        {(sale.bankName || sale.routing || sale.account) && (
          <div className="text-sm mb-3 rounded-md border p-3 bg-muted/30">
            <p className="text-muted-foreground font-medium mb-2 uppercase tracking-wide text-xs">
              Banking Information
            </p>
            <div className="grid grid-cols-3 gap-2">
              {sale.bankName && (
                <div>
                  <p className="text-muted-foreground font-medium">Bank</p>
                  <p className="font-semibold text-foreground">
                    {sale.bankName}
                  </p>
                </div>
              )}
              {sale.routing && (
                <div>
                  <p className="text-muted-foreground font-medium">Routing #</p>
                  <p className="font-semibold text-foreground font-mono">
                    {sale.routing}
                  </p>
                </div>
              )}
              {sale.account && (
                <div>
                  <p className="text-muted-foreground font-medium">Account #</p>
                  <p className="font-semibold text-foreground font-mono">
                    {sale.account}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <p className="text-xs text-muted-foreground italic mb-2">
            Note: {sale.notes}
          </p>
        )}

        {/* Voice Note */}
        {sale.voiceNoteUrl && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Voice Note:</p>
            <audio
              controls
              src={sale.voiceNoteUrl}
              className="w-full h-8"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
