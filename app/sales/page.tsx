import { saleService } from "@/lib/airtable/sale-service";
import { SalesList } from "./components/SalesList";
import LogoutButton from "@/components/buttons/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";

export const revalidate = 0; // ✅ Disable cache
export const dynamic = "force-dynamic"; // ✅ Force dynamic rendering

export default async function SalesPage() {
  const salesWithProducts = await saleService.getAllWithProductInfo();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-muted p-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-end">
            {" "}
            <LogoutButton />
          </div>
          <div className="flex  justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Sales History
            </h1>
            {/* Navigation */}
            <div className="flex flex-col lg:flex-row gap-2">
              <Link href="/warehouse?tab=outbound" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full bg-transparent cursor-pointer"
                >
                  ➕📤 Add New
                </Button>
              </Link>

              <Link href="/dashboard" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full bg-transparent cursor-pointer"
                >
                  📈 Dashboard
                </Button>
              </Link>
            </div>{" "}
          </div>
          <SalesList sales={salesWithProducts} />
        </div>
      </main>
    </Suspense>
  );
}
