"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockInventory, mockOrders, type Order, type OrderStatus } from "@/lib/data"
import Link from "next/link"

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  // Calculate stats
  const totalWeight = mockInventory.reduce((sum, item) => sum + item.weight, 0)
  const availableWeight = mockInventory.filter(i => i.status === "Available").reduce((sum, item) => sum + item.weight, 0)
  const lowStock = mockInventory.filter(item => item.quantity < 20)

  const byType = {
    carcass: mockInventory.filter(i => i.type === "carcass").reduce((sum, i) => sum + i.weight, 0),
    primal: mockInventory.filter(i => i.type === "primal").reduce((sum, i) => sum + i.weight, 0),
    cut: mockInventory.filter(i => i.type === "cut").reduce((sum, i) => sum + i.weight, 0),
  }

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(orders.map((order) => 
      order.id === id ? { ...order, status } : order
    ))
  }

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800"
      case "Confirmed": return "bg-blue-100 text-blue-800"
      case "Completed": return "bg-green-100 text-green-800"
    }
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <Link href="/">
            <Button variant="outline" size="sm">Logout</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalWeight.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Stock (kg)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{availableWeight.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Available (kg)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{mockInventory.length}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{lowStock.length}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">{byType.carcass.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Carcass</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{byType.primal.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Primal</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{byType.cut.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Cut</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-600">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-red-600 font-medium">{item.quantity} pcs / {item.weight} kg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {order.items.join(", ")} • {order.totalWeight} kg
                </p>
                <div className="flex gap-2">
                  {(["Pending", "Confirmed", "Completed"] as OrderStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={order.status === status ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => updateOrderStatus(order.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2">
          <Link href="/inventory" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Inventory</Button>
          </Link>
          <Link href="/warehouse" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Warehouse</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
