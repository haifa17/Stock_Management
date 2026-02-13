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
interface SalesCardProps {
  sale: SaleWithProduct;
}

export function SalesCard({ sale }: SalesCardProps) {
  const handlePrintInvoice = () => {
    const doc = new jsPDF();
    const now = new Date();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== FAKE LOGO =====
    // Draw a colored rectangle as placeholder logo
    doc.setFillColor(30, 120, 60); // green logo background
    doc.rect(20, 12, 25, 18, "F");

    // Logo initials
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HF", 32.5, 23, { align: "center" });

    // Reset text color
    doc.setTextColor(0);

    // ===== COMPANY NAME =====
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HALAL FARMS", 50, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("OUTBOUND INVOICE", 50, 30);

    // ===== DATE (RIGHT SIDE) =====
    doc.setFontSize(10);
    doc.text(
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      pageWidth - 20,
      22,
      { align: "right" },
    );

    // Divider line
    doc.setDrawColor(200);
    doc.line(20, 38, pageWidth - 20, 38);

    // ===== INVOICE INFO =====
    let infoY = 50;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 20, infoY);

    doc.setFont("helvetica", "normal");
    infoY += 8;

    doc.text(`Product: ${sale.product}`, 20, infoY);
    infoY += 6;
    doc.text(`Lot: ${sale.lotId}`, 20, infoY);

    // ===== BILL TO (RIGHT SIDE) =====
    let rightY = 50;

    doc.setFont("helvetica", "bold");
    doc.text("Bill To", pageWidth - 20, rightY, { align: "right" });

    doc.setFont("helvetica", "normal");
    rightY += 8;

    doc.text(`Client: ${sale.client}`, pageWidth - 20, rightY, {
      align: "right",
    });
    rightY += 6;

    doc.text(
      `Sale Date: ${new Date(sale.saleDate).toLocaleDateString()}`,
      pageWidth - 20,
      rightY,
      { align: "right" },
    );

    // ===== TABLE =====
    autoTable(doc, {
      startY: 80,
      head: [
        [
          "Description",
          "Weight Out (£)",
          "Pieces",
          "Unit Price ($)",
          "Total ($)",
        ],
      ],
      body: [
        [
          sale.product,
          sale.weightOut.toString(),
          sale.pieces.toString(),
          (sale.price / sale.pieces).toFixed(2),
          sale.price.toFixed(2),
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [30, 120, 60], // green theme
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 11 },
    });

    // ===== TOTAL =====
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable?.finalY || 80;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${sale.price.toFixed(2)}`, pageWidth - 20, finalY + 15, {
      align: "right",
    });

    // ===== NOTES =====
    if (sale.notes) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Note: ${sale.notes}`, 20, finalY + 20);
    }

    // ===== FOOTER =====
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for your business", pageWidth / 2, 285, {
      align: "center",
    });

    doc.setTextColor(0);

    // ===== SAVE =====
    doc.save(`Outbound_Invoice_${sale.lotId}.pdf`);
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
        <div className="grid grid-cols-4 gap-2 text-sm mb-3">
          <div>
            <p className="text-red-500  font-medium">Weight Out</p>
            <p className="font-semibold text-red-500 ">{sale.weightOut} £</p>
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
              {new Date(sale.saleDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground font-medium">
            Proposed Sales Price
          </p>
          <p className="font-semibold text-foreground">{sale.price} $</p>
        </div>
        {sale.notes && (
          <p className="text-xs text-muted-foreground italic">
            Note: {sale.notes}
          </p>
        )}
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
