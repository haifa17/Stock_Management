"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmergencyProductData } from "./useInboundForm";

interface EmergencyProductFieldsProps {
  data: EmergencyProductData;
  onChange: (data: EmergencyProductData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function EmergencyProductFields({
  data,
  onChange,
  onCancel,
  disabled,
}: EmergencyProductFieldsProps) {
  const update = (field: keyof EmergencyProductData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-3">
      <p className="text-sm text-amber-800 font-medium">
        ⚠️ Emergency Product Creation
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-end">
        <div className="space-y-2">
          <Label htmlFor="emergencyName">Product Name</Label>
          <Input
            id="emergencyName"
            placeholder="Enter new product name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            required
            disabled={disabled}
            className="border-amber-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyCategory">Category</Label>
          <Input
            id="emergencyCategory"
            placeholder="e.g., Beef, Chicken"
            value={data.category}
            onChange={(e) => update("category", e.target.value)}
            required
            disabled={disabled}
            className="border-amber-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyType">Type</Label>
          <Input
            id="emergencyType"
            placeholder="e.g., Cut, Primal"
            value={data.type}
            onChange={(e) => update("type", e.target.value)}
            required
            disabled={disabled}
            className="border-amber-300 bg-white"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}