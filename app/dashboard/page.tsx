import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "./components/DashboardStats";
import { StockByType } from "./components/StockByType";
import { LowStockAlert } from "./components/LowStockAlert";
import { OrdersList } from "./components/OrdersList";
import { calculateDashboardData } from "./utils";
import LogoutButton from "@/components/buttons/LogoutButton";
import { ordersService } from "@/lib/airtable/orders-service";

export const revalidate = 0; // Données en temps réel

export default async function DashboardPage() {
  const [dashboardData, orders] = await Promise.all([
    calculateDashboardData(),
    ordersService.getRecent(5),
  ]);

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>

          <LogoutButton />
        </div>

        {/* Stats Grid */}
        <DashboardStats
          totalWeight={dashboardData.totalWeight}
          availableWeight={dashboardData.availableWeight}
          totalItems={dashboardData.totalItems}
          lowStockCount={dashboardData.lowStockCount}
        />

        {/* Stock by Type */}
        <StockByType stockByType={dashboardData.stockByType} />

        {/* Low Stock Alert */}
        {dashboardData.lowStockItems.length > 0 && (
          <LowStockAlert items={dashboardData.lowStockItems} />
        )}

        {/* Orders */}
        <OrdersList initialOrders={orders} />

        {/* Navigation */}
        <div className="flex gap-2">
          <Link href="/inventory" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-transparent cursor-pointer"
            >
              Inventory
            </Button>
          </Link>
          <Link href="/warehouse" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-transparent cursor-pointer"
            >
              Warehouse
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
