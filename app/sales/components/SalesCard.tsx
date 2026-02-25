import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleWithProduct } from "../types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "./generateInvoicePDF";
interface SalesCardProps {
  sale: SaleWithProduct;
}

export function SalesCard({ sale }: SalesCardProps) {
const handlePrintInvoice = () => generateInvoicePDF(sale);

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
