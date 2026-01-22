"use client"

import { Button } from "@/components/ui/button"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { FILTER_LABELS, FILTER_OPTIONS } from "../constants"


export function InventoryFilters() {
  const { filter, setFilter } = useInventoryStore()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option}
          variant={filter === option ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(option)}
        >
          {FILTER_LABELS[option]}
        </Button>
      ))}
    </div>
  )
}