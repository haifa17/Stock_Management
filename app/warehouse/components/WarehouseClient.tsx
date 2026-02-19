"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LogoutButton from "@/components/buttons/LogoutButton";
import { OutboundForm } from "./OutboundForm";
import { InboundForm } from "./InboundForm";
import { Lot, Product } from "@/lib/types";
import { WeightScanner } from "./WeightScanner";

interface WeightEntry {
  weight: number;
  unit: string;
}

interface DetectedWeight {
  entries: WeightEntry[]; // individual scanned weights
  total: number; // sum
  unit: string; // dominant unit
}

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
  const [detectedWeight, setDetectedWeight] = useState<DetectedWeight | null>(
    null,
  );

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-end">
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Warehouse Entry
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <Link href="/inventory">
              <Button className="cursor-pointer" variant="outline" size="sm">
                📦View Inventory
              </Button>
            </Link>
            <Link href="/sales">
              <Button className="cursor-pointer" variant="outline" size="sm">
                📤View Sales
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="cursor-pointer" variant="outline" size="sm">
                📈 Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Scanner Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Scanner —{" "}
              {activeTab === "inbound" ? "Product & Weight" : "Batch & Weight"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeightScanner
              onBarcodeScanned={(code) => {
                console.log("Barcode scanned:", code);
                setScannedCode(code);
              }}
              onWeightDetected={(weights, total, unit) => {
                console.log("Weight detected:", weights, total, unit);
                setDetectedWeight({ entries: weights, total, unit });
              }}
            />

            {/* Display scanned information */}
            {(scannedCode || detectedWeight) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                {scannedCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-900 font-medium">
                      Scanned Code:
                    </span>
                    <span className="text-sm font-mono text-blue-700">
                      {scannedCode}
                    </span>
                  </div>
                )}

                {detectedWeight && (
                  <div className="space-y-1">
                    {/* Individual weights */}
                    {detectedWeight.entries.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-blue-900 font-medium">
                          Weight #{i + 1}:
                        </span>
                        <span className="text-sm font-mono text-blue-700">
                          {e.weight} {e.unit}
                        </span>
                      </div>
                    ))}
                    {/* Total (only show if more than one entry) */}
                    {detectedWeight.entries.length > 1 && (
                      <div className="flex items-center justify-between border-t border-blue-200 pt-1 mt-1">
                        <span className="text-sm text-blue-900 font-semibold">
                          Total:
                        </span>
                        <span className="text-sm font-mono font-bold text-blue-800">
                          {detectedWeight.total} {detectedWeight.unit}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setScannedCode("");
                    setDetectedWeight(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
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
                <InboundForm
                  scannedProduct={scannedCode}
                  products={products}
                  detectedWeight={
                    detectedWeight
                      ? {
                          weight: detectedWeight.total,
                          unit: detectedWeight.unit,
                        }
                      : null
                  }
                />
              </TabsContent>

              <TabsContent value="outbound">
                <OutboundForm
                  scannedBatch={scannedCode}
                  batches={batches}
                  detectedWeight={
                    detectedWeight
                      ? {
                          weight: detectedWeight.total,
                          unit: detectedWeight.unit,
                        }
                      : null
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
