import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventoryList } from "./components/InventoryList";
import LogoutButton from "@/components/buttons/LogoutButton";
import { inventoryService } from "@/lib/airtable/inventory-service";
import { LayoutDashboardIcon, PlusCircle } from "lucide-react";

export const revalidate = 0; // Désactiver le cache pour avoir les données en temps réel
export const dynamic = 'force-dynamic'; 
export default async function InventoryPage() {
  const inventory = await inventoryService.getAll();

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-end">
          <LogoutButton />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          {/* Navigation */}
          <div className="flex gap-2">
            <Link href="/warehouse?tab=inbound" className="flex-1">
              <Button
                variant="outline"
                className="w-full bg-transparent cursor-pointer"
              >
                <PlusCircle />
                Add New
              </Button>
            </Link>

            <Link href="/dashboard" className="flex-1">
              <Button
                variant="outline"
                className="w-full bg-transparent cursor-pointer"
              >
                <LayoutDashboardIcon /> Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Inventory List - Client Components */}
        <InventoryFilters />
        <InventoryList initialInventory={inventory} />
      </div>
    </main>
  );
}
