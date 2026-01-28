import { saleService } from "@/lib/airtable/sale-service";
import { SalesList } from "./components/SalesList";
import LogoutButton from "@/components/buttons/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboardIcon, PlusCircle } from "lucide-react";

export const revalidate = 0;

export default async function SalesPage() {
  const salesWithProducts = await saleService.getAllWithProductInfo();

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-md lg:max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-end">
          {" "}
          <LogoutButton />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
          {/* Navigation */}
          <div className="flex gap-2">
            <Link href="/warehouse?tab=outbound" className="flex-1">
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
          </div>{" "}
        </div>
        <SalesList sales={salesWithProducts} />
      </div>
    </main>
  );
}
