"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockInventory, type InventoryItem, type InventoryStatus } from "@/lib/data"
import Link from "next/link"

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory)
  const [filter, setFilter] = useState<"all" | InventoryStatus>("all")

  const filteredInventory = filter === "all" 
    ? inventory 
    : inventory.filter((item) => item.status === filter)

  const updateStatus = (id: string, status: InventoryStatus) => {
    setInventory(inventory.map((item) => 
      item.id === id ? { ...item, status } : item
    ))
  }

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800"
      case "Reserved": return "bg-yellow-100 text-yellow-800"
      case "Sold": return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <Link href="/">
            <Button variant="outline" size="sm">Logout</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "Available", "Reserved", "Sold"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>

        {/* Inventory List */}
        <div className="space-y-3">
          {filteredInventory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{item.lotId}</p>
                  </div>
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
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
                  {(["Available", "Reserved", "Sold"] as InventoryStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={item.status === status ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => updateStatus(item.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <Link href="/warehouse" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Add New</Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
