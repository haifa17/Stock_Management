"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { InventoryItem, InventoryStatus } from "@/lib/types"

interface InventoryCardProps {
  item: InventoryItem
}

const STATUS_STYLES: Record<InventoryStatus, string> = {
  Available: "bg-green-100 text-green-800",
  Reserved: "bg-yellow-100 text-yellow-800",
  Sold: "bg-gray-100 text-gray-800",
}

const STATUS_OPTIONS: InventoryStatus[] = ["Available", "Reserved", "Sold"]

export function InventoryCard({ item }: InventoryCardProps) {
  const { updateItemStatus } = useInventoryStore()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{item.lotId}</p>
          </div>
          <Badge className={STATUS_STYLES[item.status]}>{item.status}</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize text-foreground">{item.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Qty</p>
            <p className="font-medium text-foreground">{item.quantity} pcs</p>
          </div>
          <div>
            <p className="text-muted-foreground">Weight</p>
            <p className="font-medium text-foreground">{item.weight} kg</p>
          </div>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground mb-3">
          <span>Arrival: {item.arrivalDate}</span>
          <span>•</span>
          <span>Expiry: {item.expiryDate}</span>
        </div>

        {/* Status Update Buttons */}
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((status) => (
            <Button
              key={status}
              variant={item.status === status ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => updateItemStatus(item.id, status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}