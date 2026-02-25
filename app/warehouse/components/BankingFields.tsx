"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BankingFieldsProps {
  bankName: string;
  routing: string;
  account: string;
  onBankNameChange: (value: string) => void;
  onRoutingChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  disabled?: boolean;
}

export function BankingFields({
  bankName,
  routing,
  account,
  onBankNameChange,
  onRoutingChange,
  onAccountChange,
  disabled,
}: BankingFieldsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Banking Information
      </Label>
      <div className="space-y-3 rounded-md border p-3">
        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name</Label>
          <Input
            id="bankName"
            placeholder="Bank name"
            value={bankName}
            onChange={(e) => onBankNameChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="routing">Routing #</Label>
            <Input
              id="routing"
              placeholder="000000000"
              value={routing}
              onChange={(e) => onRoutingChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account #</Label>
            <Input
              id="account"
              placeholder="Account number"
              value={account}
              onChange={(e) => onAccountChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
