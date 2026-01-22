import { mockInventory } from "@/lib/data"

export function calculateDashboardData() {
  const totalWeight = mockInventory.reduce((sum, item) => sum + item.weight, 0)
  const availableWeight = mockInventory
    .filter(i => i.status === "Available")
    .reduce((sum, item) => sum + item.weight, 0)
  const lowStock = mockInventory.filter(item => item.quantity < 20)

  const stockByType = {
    carcass: mockInventory
      .filter(i => i.type === "carcass")
      .reduce((sum, i) => sum + i.weight, 0),
    primal: mockInventory
      .filter(i => i.type === "primal")
      .reduce((sum, i) => sum + i.weight, 0),
    cut: mockInventory
      .filter(i => i.type === "cut")
      .reduce((sum, i) => sum + i.weight, 0),
  }

  return {
    totalWeight,
    availableWeight,
    totalItems: mockInventory.length,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    stockByType,
  }
}
