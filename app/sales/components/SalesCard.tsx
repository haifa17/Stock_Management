import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleWithProduct } from "../types";

interface SalesCardProps {
  sale: SaleWithProduct;
}

export function SalesCard({ sale }: SalesCardProps) {
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
          <Badge variant="destructive">Sold</Badge>
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
            Proposal Sales Price
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
