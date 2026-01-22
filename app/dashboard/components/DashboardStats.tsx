import { Card, CardContent } from "@/components/ui/card"

interface DashboardStatsProps {
  totalWeight: number
  availableWeight: number
  totalItems: number
  lowStockCount: number
}

export function DashboardStats({
  totalWeight,
  availableWeight,
  totalItems,
  lowStockCount,
}: DashboardStatsProps) {
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
          <p className="text-2xl font-bold text-foreground">{totalItems}</p>
          <p className="text-xs text-muted-foreground">Total Items</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
          <p className="text-xs text-muted-foreground">Low Stock</p>
        </CardContent>
      </Card>
    </div>
  )
}