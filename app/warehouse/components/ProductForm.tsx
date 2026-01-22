"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomSelect } from "@/components/ui/CustomSelect"
import { InventoryStatus, ProductType } from "@/lib/types"
import { FormData, getInitialFormData } from "../utils"
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "../constants"



export function ProductForm() {
  const [formData, setFormData] = useState<FormData>(getInitialFormData())
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setSubmitted(true)
    
    // Reset form after 2 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData(getInitialFormData())
    }, 2000)
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium text-green-600">Product Added!</p>
        <p className="text-sm text-muted-foreground">Lot ID: {formData.lotId}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          placeholder="e.g. Beef Ribeye"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <CustomSelect
          id="type"
          value={formData.type}
          options={PRODUCT_TYPES}
          onChange={(value) => updateField("type", value as ProductType)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (pcs)</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="0"
            value={formData.quantity}
            onChange={(e) => updateField("quantity", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="0.0"
            value={formData.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lot ID</Label>
        <Input value={formData.lotId} disabled className="bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="arrival">Arrival Date</Label>
          <Input
            id="arrival"
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => updateField("arrivalDate", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => updateField("expiryDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <CustomSelect
          id="status"
          value={formData.status}
          options={PRODUCT_STATUSES}
          onChange={(value) => updateField("status", value as InventoryStatus)}
        />
      </div>

      <Button type="submit" className="w-full cursor-pointer mt-5">
        Add to Inventory
      </Button>
    </form>
  )
}