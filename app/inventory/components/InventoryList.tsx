"use client";

import { useEffect, useState } from "react";
import { useInventoryStore } from "@/lib/store/inventory-store";
import { InventoryCard } from "./InventoryCard";
import {  Lot } from "@/lib/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface InventoryListProps {
  initialInventory: Lot[];
}

const ITEMS_PER_PAGE = 5;

export function InventoryList({ initialInventory }: InventoryListProps) {
  const { inventory, filter, setInventory } = useInventoryStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (inventory.length === 0) {
      setInventory(initialInventory);
    }
  }, [initialInventory, inventory.length, setInventory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

 const filteredInventory = (() => {
    if (filter === "all") return inventory;
    if (filter === "Low Stock") {
      return inventory.filter(
        (item) => item.status === "Available" && item.currentStock < 20
      );
    }
    return inventory.filter((item) => item.status === filter);
  })();
  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {filteredInventory.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {startIndex + 1}-
          {Math.min(endIndex, filteredInventory.length)} of{" "}
          {filteredInventory.length} items
        </div>
      )}

      <div className="space-y-3">
        {currentItems.map((item) => (
          <InventoryCard key={item.id} item={item} />
        ))}
        {filteredInventory.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No items found for this filter.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            <PaginationItem>
              <span className="px-4 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
