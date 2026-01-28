"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";
import { SalesCard } from "./SalesCard";
import { SaleWithProduct } from "../types";


interface SalesListProps {
  sales: SaleWithProduct[];
}
const ITEMS_PER_PAGE = 5;

export function SalesList({ sales }: SalesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = sales.slice(startIndex, endIndex);
  return (
    <div className="space-y-4">
      {sales.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {startIndex + 1}-{Math.min(endIndex, sales.length)} of{" "}
          {sales.length} items
        </div>
      )}
      <div className="space-y-3">
        {currentItems.map((sale) => (
          <SalesCard key={sale.id} sale={sale} />
        ))}

        {sales.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No sales recorded yet.
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
