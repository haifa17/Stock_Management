import { lotService } from "@/lib/airtable/lot-service";
import WarehouseClient from "./components/WarehouseClient";
import { productService } from "@/lib/airtable/product-service";
import { Suspense } from "react";

interface WarehousePageProps {
  searchParams: Promise<{
    tab?: "inbound" | "outbound";
  }>;
}

export default async function WarehousePage({
  searchParams,
}: WarehousePageProps) {
  const params = await searchParams;
  const initialTab = params.tab === "outbound" ? "outbound" : "inbound";
  const [batches, products] = await Promise.all([
    lotService.getActiveBatches(),
    productService.getAll(),
  ]);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WarehouseClient
        initialTab={initialTab}
        batches={batches}
        products={products}
      />
    </Suspense>
  );
}
