import { create } from 'zustand'
import { Lot } from '../types'
import { BatchStatus } from '../airtable/airtable-types'

type FilterOption = "all" | BatchStatus 

interface InventoryStore {
  inventory: Lot[]
  filter: FilterOption
  setInventory: (inventory: Lot[]) => void
  setFilter: (filter: FilterOption) => void
  updateItemStatus: (id: string, status: BatchStatus) => void
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