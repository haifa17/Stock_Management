// components/quickbooks/InventoryTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  Id: string;
  Name: string;
  Description?: string;
  QtyOnHand?: number;
  UnitPrice?: number;
  PurchaseCost?: number;
  Active?: boolean;
}

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No inventory items found
      </div>
    );
  }

  const getStockBadge = (qty?: number) => {
    if (!qty || qty === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (qty < 10) {
      return <Badge variant="secondary" className="bg-yellow-500">Low Stock</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">In Stock</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty on Hand</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Purchase Cost</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.Id}>
              <TableCell className="font-medium">{item.Name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {item.Description || "—"}
              </TableCell>
              <TableCell className="text-right">
                {item.QtyOnHand ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                ${item.UnitPrice?.toFixed(2) ?? "0.00"}
              </TableCell>
              <TableCell className="text-right">
                ${item.PurchaseCost?.toFixed(2) ?? "0.00"}
              </TableCell>
              <TableCell>{getStockBadge(item.QtyOnHand)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}