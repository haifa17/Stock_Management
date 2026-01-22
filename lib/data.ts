// Simple mock data store for XpresTrack AI MVP

import { InventoryItem, Order } from "./types"

export const mockInventory: InventoryItem[] = [
  { id: "1", lotId: "LOT-2026-001", name: "Beef Ribeye", type: "primal", quantity: 25, weight: 187.5, arrivalDate: "2026-01-15", expiryDate: "2026-02-15", status: "Available" },
  { id: "2", lotId: "LOT-2026-002", name: "Pork Loin", type: "cut", quantity: 40, weight: 120.0, arrivalDate: "2026-01-18", expiryDate: "2026-02-10", status: "Available" },
  { id: "3", lotId: "LOT-2026-003", name: "Lamb Carcass", type: "carcass", quantity: 8, weight: 160.0, arrivalDate: "2026-01-10", expiryDate: "2026-01-25", status: "Reserved" },
  { id: "4", lotId: "LOT-2026-004", name: "Chicken Breast", type: "cut", quantity: 100, weight: 250.0, arrivalDate: "2026-01-20", expiryDate: "2026-02-05", status: "Available" },
  { id: "5", lotId: "LOT-2026-005", name: "Beef Tenderloin", type: "primal", quantity: 15, weight: 45.0, arrivalDate: "2026-01-12", expiryDate: "2026-01-28", status: "Sold" },
]

export const mockOrders: Order[] = [
  { id: "ORD-001", customer: "Metro Supermarket", items: ["Beef Ribeye", "Pork Loin"], totalWeight: 75.5, status: "Pending", date: "2026-01-20" },
  { id: "ORD-002", customer: "Fresh Foods Co.", items: ["Chicken Breast"], totalWeight: 50.0, status: "Confirmed", date: "2026-01-19" },
  { id: "ORD-003", customer: "Grill House Restaurant", items: ["Beef Tenderloin", "Lamb Carcass"], totalWeight: 25.0, status: "Completed", date: "2026-01-18" },
]

export function generateLotId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `LOT-${year}-${random}`
}
