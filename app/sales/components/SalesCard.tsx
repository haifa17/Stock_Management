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
    // Title
    doc.setFontSize(18);
    doc.text("INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Product: ${sale.product}`, 20, 40);
    doc.text(`Lot: ${sale.lotId}`, 20, 50);
    doc.text(`Client: ${sale.client}`, 130, 40);
    doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 130, 50);

    // Table with jsPDF AutoTable
    autoTable(doc, {
      startY: 60,
      head: [['Description', 'Weight Out (£)', 'Pieces', 'Unit Price ($)', 'Total ($)']],
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
      headStyles: { fillColor: [30, 60, 90], textColor: 255 },
      styles: { fontSize: 12 },
    });

    // Get Y position of table bottom
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable?.finalY || 60;

    // Add notes below table
    if (sale.notes) {
      doc.setFontSize(10);
      doc.text(`Note: ${sale.notes}`, 20, finalY + 10);
    }

    // Footer
    doc.setFontSize(12);
    doc.text(
      "Thank you for your business!",
      105,
      doc.internal.pageSize.height - 20,
      { align: "center" },
    );

    // Save PDF
    doc.save(`Invoice_${sale.lotId}.pdf`);
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
