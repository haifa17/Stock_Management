import { inventoryService } from "@/lib/airtable/inventory-service";
export const revalidate = 0; // Données en temps réel

export async function calculateDashboardData() {
  const inventory = await inventoryService.getAll();

  const totalWeight = inventory.reduce((sum, item) => sum + item.weight, 0);
  const availableWeight = inventory
    .filter((i) => i.status === "Available")
    .reduce((sum, item) => sum + item.weight, 0);
  const lowStock = inventory.filter((item) => item.quantity < 20);

  const stockByType = {
    carcass: inventory
      .filter((i) => i.type === "carcass")
      .reduce((sum, i) => sum + i.weight, 0),
    primal: inventory
      .filter((i) => i.type === "primal")
      .reduce((sum, i) => sum + i.weight, 0),
    cut: inventory
      .filter((i) => i.type === "cut")
      .reduce((sum, i) => sum + i.weight, 0),
  };

  return {
    totalWeight,
    availableWeight,
    totalItems: inventory.length,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    stockByType,
  };
}
