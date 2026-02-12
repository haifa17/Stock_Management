import { InventoryStatus } from "@/lib/airtable/airtable-types";

type FilterOption = "all" | InventoryStatus;

export const FILTER_OPTIONS: readonly FilterOption[] = [
  "all",
  "Available",
  "Reserved",
  "Sold",
  "Damaged",
  "Returned",
] as const;

export const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All",
  Available: "Available",
  Reserved: "Reserved",
  Sold: "Sold",
  Damaged: "Damaged",
  Returned: "Returned",
  "Low Stock": "Low Stock",
};
export const STATUS_STYLES: Record<InventoryStatus, string> = {
  Available: "bg-green-100 text-green-800 hover:bg-green-100",
  Reserved: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  Sold: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Damaged: "bg-blue-100 text-gray-800 hover:bg-blue-100",
  Returned: "bg-red-200 text-gray-800 hover:bg-red-100",
  "Low Stock": "bg-orange-100 text-orange-800 hover:bg-orange-100",
};

export const STATUS_OPTIONS: InventoryStatus[] = [
  "Available",
  "Reserved",
  "Sold",
  "Returned",
  "Damaged",
];
