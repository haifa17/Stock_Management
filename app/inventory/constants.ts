import { InventoryStatus } from "@/lib/types"

type FilterOption = "all" | InventoryStatus

export const FILTER_OPTIONS: readonly FilterOption[] = ["all", "Available", "Reserved", "Sold"] as const

export const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All",
  Available: "Available",
  Reserved: "Reserved",
  Sold: "Sold",
}