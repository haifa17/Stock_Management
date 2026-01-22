"use client"

import { useEffect } from "react"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { InventoryCard } from "./InventoryCard"
import { InventoryItem } from "@/lib/types"

interface InventoryListProps {
  initialInventory: InventoryItem[]
}

export function InventoryList({ initialInventory }: InventoryListProps) {
  const { inventory, filter, setInventory } = useInventoryStore()

  // Initialize inventory on mount
  useEffect(() => {
    if (inventory.length === 0) {
      setInventory(initialInventory)
    }
  }, [initialInventory, inventory.length, setInventory])

  const filteredInventory = filter === "all" 
    ? inventory 
    : inventory.filter((item) => item.status === filter)

  return (
    <div className="space-y-3">
      {filteredInventory.map((item) => (
        <InventoryCard key={item.id} item={item} />
      ))}
      {filteredInventory.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No items found for this filter.
        </p>
      )}
    </div>
  )
}