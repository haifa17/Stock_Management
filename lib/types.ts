
export type ProductType = "carcass" | "primal" | "cut"
export type InventoryStatus = "Available" | "Reserved" | "Sold"
export type OrderStatus = "Pending" | "Confirmed" | "Completed"

export interface InventoryItem {
  id: string
  lotId: string
  name: string
  type: ProductType
  quantity: number
  weight: number
  arrivalDate: string
  expiryDate: string
  status: InventoryStatus
}

export interface Order {
  id: string
  customer: string
  items: string[]
  totalWeight: number
  status: OrderStatus
  date: string
}
