import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mockInventory } from "@/lib/data";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventoryList } from "./components/InventoryList";
import LogoutButton from "@/components/buttons/LogoutButton";

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-md lg:max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <LogoutButton />
        </div>

        {/* Filters & Inventory List - Client Components */}
        <InventoryFilters />
        <InventoryList initialInventory={mockInventory} />

        {/* Navigation */}
        <div className="flex gap-2">
          <Link href="/warehouse" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-transparent cursor-pointer"
            >
              Add New
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-transparent cursor-pointer"
            >
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
