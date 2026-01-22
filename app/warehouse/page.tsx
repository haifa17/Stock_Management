import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { ProductForm } from "./components/ProductForm";
import LogoutButton from "@/components/buttons/LogoutButton";

export default function WarehousePage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-md lg:max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Warehouse Entry</h1>
          <div className="flex items-center gap-2">
            <Link href="/inventory" className="">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent cursor-pointer"
              >
                View Inventory
              </Button>
            </Link>
            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Barcode Scanner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scan Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BarcodeScanner />
          </CardContent>
        </Card>

        {/* Product Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2"></div>
      </div>
    </main>
  );
}
