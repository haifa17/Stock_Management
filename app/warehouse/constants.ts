import { InventoryStatus, ProductType } from "@/lib/airtable/airtable-types";

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "carcass", label: "Carcass" },
  { value: "primal", label: "Primal" },
  { value: "cut", label: "Cut" },
];

export const PRODUCT_STATUSES: { value: InventoryStatus; label: string }[] = [
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "Sold", label: "Sold" },
  { value: "Low Stock", label: "Low Stock" },
];
