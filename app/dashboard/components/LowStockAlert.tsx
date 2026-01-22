import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryItem } from "@/lib/types"

interface LowStockAlertProps {
  items: InventoryItem[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <Card className="border-red-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-red-600">Low Stock Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-foreground">{item.name}</span>
              <span className="text-red-600 font-medium">
                {item.quantity} pcs / {item.weight} kg
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}