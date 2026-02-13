"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInventoryStore } from "@/lib/store/inventory-store";
import { toast } from "react-toastify";
import { BatchStatus } from "@/lib/airtable/airtable-types";
import axios from "axios";
import { Lot } from "@/lib/types";
import { STATUS_OPTIONS, STATUS_STYLES } from "../constants";

interface InventoryCardProps {
  item: Lot;
}
export function InventoryCard({ item }: InventoryCardProps) {
  const { updateItemStatus } = useInventoryStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (status: BatchStatus) => {
    setIsUpdating(true);
    try {
      await axios.patch(`/api/inventory/${item.id}`, {
        status,
      });
      updateItemStatus(item.id, status);
      toast.success("Status updated successfully");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };
  const getStatusDisplay = () => {
    if (item.status === "Available" && item.currentStock < 20) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          Low Stock
        </Badge>
      );
    }
    return <Badge className={STATUS_STYLES[item.status]}>{item.status}</Badge>;
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {item.product}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {item.lotId}
            </p>
          </div>
          {getStatusDisplay()}
        </div>

        {/* Lot Details */}
        {(item.provider || item.grade || item.brand) && (
          <div className="grid grid-cols-4 gap-2 text-sm mb-2">
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
            {item.price && (
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium text-foreground">
                  {item.price?.toFixed(2) || "0.00"}$
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Current</p>
            <p className="font-medium text-foreground">{item.currentStock} £</p>
          </div>
          <div>
            <p className="text-muted-foreground">Received</p>
            <p className="font-medium text-foreground">{item.qtyReceived} £</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sold</p>
            <p className="font-medium text-foreground">{item.totalSold} £</p>
          </div>
        </div>

        {(item.origin || item.condition) && (
          <div className="flex gap-2 text-sm font-semibold text-muted-foreground mb-2">
            {item.origin && <span>Origin: {item.origin}</span>}
            {item.origin && item.condition && <span>•</span>}
            {item.condition && <span>Condition: {item.condition}</span>}
          </div>
        )}

        <div className="flex gap-2 text-sm  text-muted-foreground mb-3">
          <span>
            Arrival: {new Date(item.arrivalDate).toISOString().split("T")[0]}
          </span>
          {item.productionDate && (
            <>
              <span>•</span>
              <span>Production: {item.productionDate}</span>
            </>
          )}
          {item.expirationDate && (
            <>
              <span>•</span>
              <span className="text-amber-600 font-medium">
                Expires: {item.expirationDate}
              </span>
            </>
          )}
        </div>

        {item.notes && (
          <p className="text-xs text-muted-foreground mb-3 italic">
            Note: {item.notes}
          </p>
        )}
        {item.voiceNoteUrl && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Voice Note:</p>
            <audio
              controls
              src={item.voiceNoteUrl}
              className="w-full h-8"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {/* Status Update Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-5">
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
