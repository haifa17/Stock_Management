"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInventoryStore } from "@/lib/store/inventory-store";
import { InventoryItem } from "@/lib/types";
import { toast } from "react-toastify";
import { InventoryStatus } from "@/lib/airtable/airtable-types";
import { STATUS_OPTIONS, STATUS_STYLES } from "../constants";

interface InventoryCardProps {
  item: InventoryItem;
}

export function InventoryCard({ item }: InventoryCardProps) {
  const { updateItemStatus } = useInventoryStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (status: InventoryStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        updateItemStatus(item.id, status);
        toast.success("Status updated successfully");
      } else {
        console.error("Error updating status");
        toast.error("Error updating status");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Connection error");
    } finally {
      setIsUpdating(false);
    }
  };
  console.log("item",item)
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {item.lotId}
            </p>
          </div>
          <Badge className={STATUS_STYLES[item.status]}>{item.status}</Badge>
        </div>

        {/* Lot Details */}
        {(item.provider || item.grade || item.brand) && (
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            {item.provider && (
              <div>
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium text-foreground">{item.provider}</p>
              </div>
            )}
            {item.grade && (
              <div>
                <p className="text-muted-foreground">Grade</p>
                <p className="font-medium text-foreground">{item.grade}</p>
              </div>
            )}
            {item.brand && (
              <div>
                <p className="text-muted-foreground">Brand</p>
                <p className="font-medium text-foreground">{item.brand}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-medium text-foreground">{item.quantity} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Received</p>
            <p className="font-medium text-foreground">{item.qtyReceived} kg</p>
          </div>
        </div>

        {(item.origin || item.condition) && (
          <div className="flex gap-2 text-xs text-muted-foreground mb-2">
            {item.origin && <span>Origin: {item.origin}</span>}
            {item.origin && item.condition && <span>•</span>}
            {item.condition && <span>Condition: {item.condition}</span>}
          </div>
        )}

        <div className="flex gap-2 text-xs text-muted-foreground mb-3">
          <span>Arrival: {item.arrivalDate}</span>
          {item.expiryDate && (
            <>
              <span>•</span>
              <span>Production: {item.expiryDate}</span>
            </>
          )}
        </div>

        {item.notes && (
          <p className="text-xs text-muted-foreground mb-3 italic">
            Note: {item.notes}
          </p>
        )}

        {/* Status Update Buttons */}
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((status) => (
            <Button
              key={status}
              variant={item.status === status ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs cursor-pointer"
              onClick={() => handleUpdateStatus(status)}
              disabled={isUpdating}
            >
              {status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
