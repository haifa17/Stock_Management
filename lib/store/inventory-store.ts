import { create } from 'zustand'
import { InventoryItem } from '../types'
import { InventoryStatus } from '../airtable/airtable-types'

type FilterOption = "all" | InventoryStatus

interface InventoryStore {
  inventory: InventoryItem[]
  filter: FilterOption
  setInventory: (inventory: InventoryItem[]) => void
  setFilter: (filter: FilterOption) => void
  updateItemStatus: (id: string, status: InventoryStatus) => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  inventory: [],
  filter: "all",
  
  setInventory: (inventory) => set({ inventory }),
  
  setFilter: (filter) => set({ filter }),
  
  updateItemStatus: (id, status) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),
}))