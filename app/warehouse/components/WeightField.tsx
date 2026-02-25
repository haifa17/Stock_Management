"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeightFieldProps {
  value: string;
  autoFilled: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  max?: number;
}

export function WeightField({
  value,
  autoFilled,
  onChange,
  disabled,
  label = "Qty Received (lb)",
  max,
}: WeightFieldProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex items-center gap-2">
        {label}
        {autoFilled && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
            ⚖️ Auto-filled from scanner
          </span>
        )}
      </Label>
      <Input
        id={inputId}
        type="number"
        step="0.01"
        min="0"
        max={max}
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
