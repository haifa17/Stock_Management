import { InventoryStatus } from "@/lib/types"

type FilterOption = "all" | InventoryStatus

export const FILTER_OPTIONS: readonly FilterOption[] = ["all", "Available", "Reserved", "Sold"] as const

export const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All",
  Available: "Available",
  Reserved: "Reserved",
  Sold: "Sold",
}

export const STATUS_STYLES: Record<InventoryStatus, string> = {
  Available: "bg-green-100 text-green-800",
  Reserved: "bg-yellow-100 text-yellow-800",
  Sold: "bg-gray-100 text-gray-800",
}

export const STATUS_OPTIONS: InventoryStatus[] = ["Available", "Reserved", "Sold"]