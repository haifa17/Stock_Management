import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

interface DashboardStatsProps {
  totalWeight: number;
  availableWeight: number;
  lowStockCount: number;
  totalInboundToday: number;
  totalOutboundToday: number;
  stockTurnover: number;
}

export function DashboardStats({
  totalWeight,
  availableWeight,
  lowStockCount,
  totalInboundToday,
  totalOutboundToday,
  stockTurnover,
}: DashboardStatsProps) {
  const netChange = totalInboundToday - totalOutboundToday;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {totalWeight.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Total Stock (kg)</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {availableWeight.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Available (kg)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
          <p className="text-xs text-muted-foreground">Low Stock</p>
        </CardContent>
      </Card>
      {/* Inbound Today */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUp className="h-4 w-4 text-green-500" />
            <p className="text-2xl font-bold text-green-600">
              {totalInboundToday.toFixed(1)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Inbound Today (kg)</p>
        </CardContent>
      </Card>

      {/* Outbound Today */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDown className="h-4 w-4 text-red-500" />
            <p className="text-2xl font-bold text-red-600">
              {totalOutboundToday.toFixed(1)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Outbound Today (kg)</p>
        </CardContent>
      </Card>

      {/* Net Change */}
      <Card>
        <CardContent className="p-4 text-center">
          <p
            className={`text-2xl font-bold ${
              netChange >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {netChange >= 0 ? "+" : ""}
            {netChange.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Net Change (kg)</p>
        </CardContent>
      </Card>

      {/* Stock Turnover */}
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {stockTurnover.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Stock Turnover (7days)
          </p>{" "}
        </CardContent>
      </Card>
    </div>
  );
}
