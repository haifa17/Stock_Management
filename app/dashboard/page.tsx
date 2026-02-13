import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "./components/DashboardStats";
import { LowStockAlert } from "./components/LowStockAlert";
import { calculateDashboardData } from "./utils";
import LogoutButton from "@/components/buttons/LogoutButton";
import { RecentActivity } from "./components/RecentActivity";
import { Suspense } from "react";

export const revalidate = 0; // Données en temps réel

export default async function DashboardPage() {
  const [dashboardData] = await Promise.all([
    calculateDashboardData(),
    // ordersService.getRecent(5),
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-muted p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-end">
            <LogoutButton />
          </div>
          {/* Header */}

          {/* Navigation */}
          <div className="flex flex-wrap md:flex-row gap-2">
            <Link href="/warehouse">
              <Button variant="outline" className=" cursor-pointer" size="sm">
                🏪Warehouse
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className=" cursor-pointer" size="sm">
                📦Inventory
              </Button>
            </Link>
            <Link href="/sales">
              <Button className=" cursor-pointer" variant="outline" size="sm">
                📤Sales
              </Button>
            </Link>
            <Link href="/quickbook">
              <Button className=" cursor-pointer" size="sm">
                🔗 Connect to QuickBooks
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <DashboardStats
            totalWeight={dashboardData.totalWeight}
            availableWeight={dashboardData.availableWeight}
            lowStockCount={dashboardData.lowStockCount}
            totalInboundToday={dashboardData.totalInboundToday}
            totalOutboundToday={dashboardData.totalOutboundToday}
            stockTurnover={dashboardData.stockTurnover}
          />

          {/* Stock by Type
        <StockByType stockByType={dashboardData.stockByType} /> */}
          {/* Recent Activity - NEW */}
          <RecentActivity
            recentInbound={dashboardData.recentInbound}
            recentOutbound={dashboardData.recentOutbound}
          />

          {/* Low Stock Alert */}
          {dashboardData.lowStockItems.length > 0 && (
            <LowStockAlert items={dashboardData.lowStockItems} />
          )}

          {/* Orders */}
          {/* <OrdersList initialOrders={orders} /> */}
        </div>
      </main>
    </Suspense>
  );
}
