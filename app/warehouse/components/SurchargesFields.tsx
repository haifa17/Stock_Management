"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SurchargesFieldsProps {
  freightCharge: string;
  fuelSurcharge: string;
  onFreightChange: (value: string) => void;
  onFuelChange: (value: string) => void;
  disabled?: boolean;
}

export function SurchargesFields({
  freightCharge,
  fuelSurcharge,
  onFreightChange,
  onFuelChange,
  disabled,
}: SurchargesFieldsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Surcharges (optional)
      </Label>
      <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
        <div className="space-y-2">
          <Label htmlFor="freightCharge">Freight / Delivery ($)</Label>
          <Input
            id="freightCharge"
            type="number"
            step="0.01"
            placeholder="0.00"
            min="0"
            value={freightCharge}
            onChange={(e) => onFreightChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelSurcharge">Fuel Surcharge ($)</Label>
          <Input
            id="fuelSurcharge"
            type="number"
            step="0.01"
            placeholder="0.00"
            min="0"
            value={fuelSurcharge}
            onChange={(e) => onFuelChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
