"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lot } from "@/lib/types";
import { VoiceRecorder } from "./Voicerecorder";

import { useOutboundForm } from "./useOutboundForm";
import { BatchSelector } from "./BatchSelector";
import { SurchargesFields } from "./SurchargesFields";
import { BankingFields } from "./BankingFields";
import { WeightField } from "./WeightField"; // reused from inbound

interface OutboundFormProps {
  scannedBatch?: string;
  batches: Lot[];
  detectedWeight?: { weight: number; unit: string } | null;
}

export function OutboundForm({ scannedBatch, batches, detectedWeight }: OutboundFormProps) {
  const {
    selectedBatch,
    handleBatchChange,
    formData,
    updateField,
    updateWeightOut,
    handleVoiceRecording,
    isSubmitting,
    submitted,
    weightAutoFilled,
    handleSubmit,
  } = useOutboundForm({ scannedBatch, batches, detectedWeight });

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium text-green-600">Order Completed!</p>
        <p className="text-sm text-muted-foreground">Batch: {selectedBatch?.lotId}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Current stock automatically updated
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Batch selection */}
      <BatchSelector
        batches={batches}
        selectedBatch={selectedBatch}
        onChange={handleBatchChange}
      />

      {/* Weight out */}
      <WeightField
        value={formData.weightOut}
        autoFilled={weightAutoFilled}
        onChange={updateWeightOut}
        disabled={isSubmitting}
        label="Weight Out (lb)"
        max={selectedBatch?.currentStock}
      />

      {/* Pieces */}
      <div className="space-y-2">
        <Label htmlFor="pieces">Pieces</Label>
        <Input
          id="pieces"
          type="number"
          placeholder="0"
          min="0"
          value={formData.pieces}
          onChange={(e) => updateField("pieces", e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base"
        />
      </div>

      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="client">Client Name</Label>
        <Input
          id="client"
          placeholder="Client name"
          value={formData.client}
          onChange={(e) => updateField("client", e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Proposed Sales Price ($)</Label>
        <Input
          id="price"
          type="number"
          step="0.1"
          placeholder="0"
          min="0"
          value={formData.price}
          onChange={(e) => updateField("price", e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base"
        />
      </div>

      {/* Surcharges */}
      <SurchargesFields
        freightCharge={formData.freightCharge}
        fuelSurcharge={formData.fuelSurcharge}
        onFreightChange={(v) => updateField("freightCharge", v)}
        onFuelChange={(v) => updateField("fuelSurcharge", v)}
        disabled={isSubmitting}
      />

      {/* Payment Terms */}
      <div className="space-y-2">
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Input
          id="paymentTerms"
          placeholder="e.g. Net 30, COD"
          value={formData.paymentTerms}
          onChange={(e) => updateField("paymentTerms", e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Seller EIN */}
      <div className="space-y-2">
        <Label htmlFor="sellerEIN">Seller EIN</Label>
        <Input
          id="sellerEIN"
          placeholder="XX-XXXXXXX"
          value={formData.sellerEIN}
          onChange={(e) => updateField("sellerEIN", e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Previous Balance & Credits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="previousBalance">Previous Balance ($)</Label>
          <Input
            id="previousBalance"
            type="number"
            step="0.01"
            placeholder="0.00"
            min="0"
            value={formData.previousBalance}
            onChange={(e) => updateField("previousBalance", e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="credits">Credits ($)</Label>
          <Input
            id="credits"
            type="number"
            step="0.01"
            placeholder="0.00"
            min="0"
            value={formData.credits}
            onChange={(e) => updateField("credits", e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Banking Info */}
      <BankingFields
        bankName={formData.bankName}
        routing={formData.routing}
        account={formData.account}
        onBankNameChange={(v) => updateField("bankName", v)}
        onRoutingChange={(v) => updateField("routing", v)}
        onAccountChange={(v) => updateField("account", v)}
        disabled={isSubmitting}
      />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          disabled={isSubmitting}
          placeholder="Add any notes about this batch..."
        />
      </div>

      {/* Voice Note */}
      <div className="space-y-2">
        <Label>Voice Note (optional)</Label>
        <VoiceRecorder onRecordingComplete={handleVoiceRecording} disabled={isSubmitting} />
      </div>

      <Button
        type="submit"
        className="w-full cursor-pointer mt-5"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Complete Order"}
      </Button>
    </form>
  );
}