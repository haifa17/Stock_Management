"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { AlertTriangle } from "lucide-react";
import { Product } from "@/lib/types";
import { VoiceRecorder } from "./Voicerecorder";

import { useInboundForm } from "./useInboundForm";
import { EmergencyProductFields } from "./EmergencyProductFields";
import { InvoiceUpload } from "./InvoiceUpload";
import { WeightField } from "./WeightField";

interface InboundFormProps {
  scannedProduct?: string;
  products?: Product[];
  detectedWeight?: { weight: number; unit: string } | null;
}

export function InboundForm({ scannedProduct, products, detectedWeight }: InboundFormProps) {
  const {
    selectedProductId,
    setSelectedProductId,
    isEmergencyProduct,
    emergencyProductData,
    setEmergencyProductData,
    enableEmergencyMode,
    cancelEmergencyMode,
    formData,
    updateField,
    updateQtyReceived,
    lotId,
    voiceNote,
    handleVoiceRecording,
    invoiceFile,
    invoicePreview,
    fileInputRef,
    handleFileUpload,
    removeInvoice,
    isSubmitting,
    submitted,
    weightAutoFilled,
    handleSubmit,
  } = useInboundForm({ scannedProduct, products, detectedWeight });

  const productOptions = products!.map((p) => ({ value: p.id, label: p.name }));

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium text-green-600">Arrival Confirmed!</p>
        <p className="text-sm text-muted-foreground">Lot ID: {lotId}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Product Selection */}
      {!isEmergencyProduct ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="product">Product Name</Label>
            <CustomSelect
              id="product"
              value={selectedProductId}
              options={productOptions}
              onChange={setSelectedProductId}
            />
            {!selectedProductId && (
              <p className="text-sm text-muted-foreground">
                Can't find the product? Use the emergency button below.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={enableEmergencyMode}
            disabled={isSubmitting}
            className="w-full cursor-pointer border-red-500 text-red-500 hover:bg-amber-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Create Emergency Product
          </Button>
        </>
      ) : (
        <EmergencyProductFields
          data={emergencyProductData}
          onChange={setEmergencyProductData}
          onCancel={cancelEmergencyMode}
          disabled={isSubmitting}
        />
      )}

      {/* Core fields */}
      {(
        [
          { id: "provider", label: "Provider", placeholder: "Provider name" },
          { id: "grade", label: "Grade", placeholder: "e.g. Premium, Standard" },
          { id: "brand", label: "Brand", placeholder: "Brand name" },
          { id: "origin", label: "Origin", placeholder: "Country/Region of origin" },
          { id: "condition", label: "Condition", placeholder: "Product condition" },
        ] as const
      ).map(({ id, label, placeholder }) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            placeholder={placeholder}
            value={formData[id]}
            onChange={(e) => updateField(id, e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      ))}

      {/* Date fields */}
      {(
        [
          { id: "productionDate", label: "Production Date" },
          { id: "expirationDate", label: "Expiration Date" },
        ] as const
      ).map(({ id, label }) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type="date"
            value={formData[id]}
            onChange={(e) => updateField(id, e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      ))}

      {/* Weight / Qty */}
      <WeightField
        value={formData.qtyReceived}
        autoFilled={weightAutoFilled}
        onChange={updateQtyReceived}
        disabled={isSubmitting}
      />

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input
          id="price"
          type="number"
          step="0.1"
          min="0"
          placeholder="0"
          value={formData.price}
          onChange={(e) => updateField("price", e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base"
        />
      </div>

      {/* Invoice */}
      <div className="space-y-2">
        <Label>Invoice (optional)</Label>
        <InvoiceUpload
          file={invoiceFile}
          preview={invoicePreview}
          fileInputRef={fileInputRef}
          onUpload={handleFileUpload}
          onRemove={removeInvoice}
          disabled={isSubmitting}
        />
      </div>

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

      {/* Lot ID */}
      <div className="space-y-2">
        <Label>Lot ID (Auto-generated)</Label>
        <Input value={lotId} disabled className="bg-muted" />
      </div>

      <Button type="submit" className="w-full cursor-pointer mt-5" disabled={isSubmitting}>
        {isSubmitting ? "Confirming..." : "Confirm Arrival"}
      </Button>
    </form>
  );
}