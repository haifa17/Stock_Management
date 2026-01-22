import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { ProductForm } from "./components/ProductForm";

export default function WarehousePage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Warehouse Entry</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </Link>
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
        <div className="flex gap-2">
          <Link href="/inventory" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              View Inventory
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
