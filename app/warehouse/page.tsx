"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { generateLotId, type ProductType, type InventoryStatus } from "@/lib/data"
import Link from "next/link"

export default function WarehousePage() {
  const [scannedCode, setScannedCode] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    type: "cut" as ProductType,
    quantity: "",
    weight: "",
    lotId: generateLotId(),
    arrivalDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    status: "Available" as InventoryStatus,
  })
  const [submitted, setSubmitted] = useState(false)

  const handleScan = () => {
    setScannedCode("SCAN-" + Math.random().toString(36).substring(7).toUpperCase())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        ...formData,
        name: "",
        quantity: "",
        weight: "",
        lotId: generateLotId(),
        expiryDate: "",
      })
      setScannedCode("")
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Warehouse Entry</h1>
          <Link href="/">
            <Button variant="outline" size="sm">Logout</Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scan Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleScan} className="w-full" variant="secondary">
              Scan QR / Barcode
            </Button>
            {scannedCode && (
              <p className="text-sm text-muted-foreground text-center">
                Scanned: <span className="font-mono text-foreground">{scannedCode}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-lg font-medium text-green-600">Product Added!</p>
                <p className="text-sm text-muted-foreground">Lot ID: {formData.lotId}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Beef Ribeye"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type">Type</Label>
                  <select 
                    id="type"
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="carcass">Carcass</option>
                    <option value="primal">Primal</option>
                    <option value="cut">Cut</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="quantity">Quantity (pcs)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Lot ID</Label>
                  <Input value={formData.lotId} disabled className="bg-muted" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="arrival">Arrival Date</Label>
                    <Input
                      id="arrival"
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select 
                    id="status"
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">
                  Add to Inventory
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href="/inventory" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">View Inventory</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
