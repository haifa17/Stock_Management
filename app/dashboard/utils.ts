import { inventoryService } from "@/lib/airtable/inventory-service";
import { lotService } from "@/lib/airtable/lot-service";
import { saleService } from "@/lib/airtable/sale-service";
export const revalidate = 0; // Données en temps réel

export async function calculateDashboardData() {
  const inventory = await inventoryService.getAll();

  const totalQuantity  = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const availableQuantity  = inventory
    .filter((i) => i.status === "Available")
    .reduce((sum, item) => sum + item.quantity, 0);
  
  // FIXED: Use weight instead of quantity for consistency
  // Since weight is the actual CurrentStock value
  const lowStock = inventory.filter(
    (item) => item.status === "Available" && item.currentStock < 20
  );

  const stockByType = {
    carcass: inventory
      .filter((i) => i.type === "carcass")
      .reduce((sum, i) => sum + i.quantity, 0),
    primal: inventory
      .filter((i) => i.type === "primal")
      .reduce((sum, i) => sum + i.quantity, 0),
    cut: inventory
      .filter((i) => i.type === "cut")
      .reduce((sum, i) => sum + i.quantity, 0),
  };

  // Get recent inbound (lots created today or in the last 7 days)
  const allLots = await lotService.getAll();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recentInbound = allLots
    .filter((lot) => {
      if (!lot.arrivalDate) return false;
      const arrivalDate = new Date(lot.arrivalDate);
      const daysDiff = Math.floor(
        (today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysDiff <= 7;
    })
    .sort((a, b) => {
      const dateA = new Date(a.arrivalDate || 0);
      const dateB = new Date(b.arrivalDate || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Get recent outbound (sales from today or last 7 days)
  const allSales = await saleService.getAll();
  const recentOutbound = allSales
    .filter((sale) => {
      if (!sale.saleDate) return false;
      const saleDate = new Date(sale.saleDate);
      const daysDiff = Math.floor(
        (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysDiff <= 7;
    })
    .sort((a, b) => {
      const dateA = new Date(a.saleDate || 0);
      const dateB = new Date(b.saleDate || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Calculate today's totals
  const totalInboundToday = allLots
    .filter((lot) => {
      if (!lot.arrivalDate) return false;
      const arrivalDate = new Date(lot.arrivalDate);
      arrivalDate.setHours(0, 0, 0, 0);
      return arrivalDate.getTime() === today.getTime();
    })
    .reduce((sum, lot) => sum + (lot.qtyReceived || 0), 0);

  const totalOutboundToday = allSales
    .filter((sale) => {
      if (!sale.saleDate) return false;
      const saleDate = new Date(sale.saleDate);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    })
    .reduce((sum, sale) => sum + (sale.weightOut || 0), 0);

  // Calculate stock turnover (total outbound last 7 days / average stock)
  const last7DaysOutbound = allSales
    .filter((sale) => {
      if (!sale.saleDate) return false;
      const saleDate = new Date(sale.saleDate);
      const daysDiff = Math.floor(
        (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysDiff <= 7;
    })
    .reduce((sum, sale) => sum + (sale.weightOut || 0), 0);

  const stockTurnover =
    availableQuantity > 0 ? (last7DaysOutbound / availableQuantity) * 100 : 0;

  return {
    totalWeight: Math.round(totalQuantity * 100) / 100,
    availableWeight: Math.round(availableQuantity * 100) / 100,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    stockByType: {
      carcass: Math.round(stockByType.carcass * 100) / 100,
      primal: Math.round(stockByType.primal * 100) / 100,
      cut: Math.round(stockByType.cut * 100) / 100,
    },
    recentInbound,
    recentOutbound,
    totalInboundToday: Math.round(totalInboundToday * 100) / 100,
    totalOutboundToday: Math.round(totalOutboundToday * 100) / 100,
    stockTurnover: Math.round(stockTurnover * 100) / 100,
  };
}