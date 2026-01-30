"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LogoutButton from "@/components/buttons/LogoutButton";
import { BarcodeScanner } from "./BarcodeScanner";
import { OutboundForm } from "./OutboundForm";
import { InboundForm } from "./InboundForm";
import { Lot, Product } from "@/lib/types";

interface Props {
  initialTab: "inbound" | "outbound";
  batches: Lot[];
  products: Product[];
}

export default function WarehouseClient({
  initialTab,
  batches,
  products,
}: Props) {
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound">(
    initialTab,
  );
  const [scannedCode, setScannedCode] = useState("");

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-end">
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex  justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Warehouse Entry
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-2">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                View Inventory
              </Button>
            </Link>

            <Link href="/sales">
              <Button variant="outline" size="sm">
                View Sales
              </Button>
            </Link>
          </div>
        </div>

        {/* Barcode Scanner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Scan {activeTab === "inbound" ? "Product" : "Lot/Batch"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner onScan={setScannedCode} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as "inbound" | "outbound");
                setScannedCode("");
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inbound">Inbound</TabsTrigger>
                <TabsTrigger value="outbound">Outbound</TabsTrigger>
              </TabsList>

              <TabsContent value="inbound">
                <InboundForm scannedProduct={scannedCode} products={products} />
              </TabsContent>

              <TabsContent value="outbound">
                <OutboundForm scannedBatch={scannedCode} batches={batches} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
