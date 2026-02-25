"use client";

import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Lot } from "@/lib/types";

interface BatchSelectorProps {
  batches: Lot[];
  selectedBatch: Lot | null;
  onChange: (lotId: string) => void;
}

export function BatchSelector({ batches, selectedBatch, onChange }: BatchSelectorProps) {
  const options = batches.map((b) => ({
    value: b.lotId,
    label: `${b.lotId} (${b.product})`,
  }));

  return (
    <div className="space-y-2">
      <Label htmlFor="batch">Lot/Batch</Label>
      <CustomSelect
        id="batch"
        value={selectedBatch?.lotId ?? ""}
        options={options}
        onChange={onChange}
      />
      {selectedBatch && (
        <p className="text-sm text-muted-foreground">
          Available: {selectedBatch.currentStock} lb
        </p>
      )}
    </div>
  );
}