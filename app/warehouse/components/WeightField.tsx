"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeightFieldProps {
  value: string;
  autoFilled: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WeightField({
  value,
  autoFilled,
  onChange,
  disabled,
}: WeightFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="qtyReceived" className="flex items-center gap-2">
        Qty Received (lb)
        {autoFilled && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
            ⚖️ Auto-filled from scanner
          </span>
        )}
      </Label>
      <Input
        id="qtyReceived"
        type="number"
        step="0.01"
        min="0"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        className={`text-2xl py-6 placeholder:text-base ${
          autoFilled ? "border-green-500 bg-green-50" : ""
        }`}
      />
    </div>
  );
}
