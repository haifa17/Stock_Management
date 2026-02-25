"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import { Lot } from "@/lib/types";

export interface OutboundFormData {
  weightOut: string;
  pieces: string;
  client: string;
  price: string;
  paymentTerms: string;
  sellerEIN: string;
  previousBalance: string;
  credits: string;
  bankName: string;
  routing: string;
  account: string;
  freightCharge: string;
  fuelSurcharge: string;
  notes: string;
}

const EMPTY_FORM: OutboundFormData = {
  weightOut: "",
  pieces: "",
  client: "",
  price: "",
  paymentTerms: "",
  sellerEIN: "",
  previousBalance: "",
  credits: "",
  bankName: "",
  routing: "",
  account: "",
  freightCharge: "",
  fuelSurcharge: "",
  notes: "",
};

interface UseOutboundFormProps {
  scannedBatch?: string;
  batches: Lot[];
  detectedWeight?: { weight: number; unit: string } | null;
}

export function useOutboundForm({
  scannedBatch,
  batches,
  detectedWeight,
}: UseOutboundFormProps) {
  const router = useRouter();

  const [selectedBatch, setSelectedBatch] = useState<Lot | null>(null);
  const [formData, setFormData] = useState<OutboundFormData>(EMPTY_FORM);
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weightAutoFilled, setWeightAutoFilled] = useState(false);

  // Default to first batch on mount
  useEffect(() => {
    if (batches.length > 0 && !selectedBatch && !scannedBatch) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch, scannedBatch]);

  // Handle scanned batch
  useEffect(() => {
    if (!scannedBatch) return;
    const batch = batches.find((b) => b.lotId === scannedBatch);
    if (batch) {
      setSelectedBatch(batch);
      toast.success(`Batch "${scannedBatch}" selected!`);
    } else {
      toast.error("Batch not found in active lots");
    }
  }, [scannedBatch, batches]);

  // Handle detected weight from OCR scanner
  useEffect(() => {
    if (!detectedWeight) return;

    const isKg = detectedWeight.unit === "KG" || detectedWeight.unit === "KGSS";
    const weightInLbs = isKg
      ? detectedWeight.weight * 2.20462
      : detectedWeight.weight;

    const message = isKg
      ? `Weight detected: ${detectedWeight.weight} ${detectedWeight.unit} (converted to ${weightInLbs.toFixed(2)} LBS)`
      : `Weight detected: ${detectedWeight.weight} ${detectedWeight.unit}`;

    toast.success(message);

    if (selectedBatch && weightInLbs > selectedBatch.currentStock) {
      toast.warning(
        `Detected weight (${weightInLbs.toFixed(2)} lb) exceeds available stock (${selectedBatch.currentStock} lb)`,
      );
    }

    setFormData((prev) => ({ ...prev, weightOut: weightInLbs.toFixed(2) }));
    setWeightAutoFilled(true);
  }, [detectedWeight, selectedBatch]);

  // Helpers
  const updateField = (field: keyof OutboundFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateWeightOut = (value: string) => {
    updateField("weightOut", value);
    setWeightAutoFilled(false);
  };

  const handleVoiceRecording = (blob: Blob) =>
    setVoiceNote(blob.size > 0 ? blob : null);

  const handleBatchChange = (lotId: string) => {
    const batch = batches.find((b) => b.lotId === lotId);
    if (batch) setSelectedBatch(batch);
  };

  const resetForm = () => {
    setSubmitted(false);
    setSelectedBatch(null);
    setFormData(EMPTY_FORM);
    setVoiceNote(null);
    setWeightAutoFilled(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("batchId", selectedBatch.lotId);

      // Append all form fields, skipping empty optional ones
      (Object.keys(formData) as (keyof OutboundFormData)[]).forEach((key) => {
        const value = formData[key];
        if (value) payload.append(key, value);
      });

      if (voiceNote) payload.append("voiceNote", voiceNote, "voice-note.webm");

      await axios.post("/api/inventory/outbound", payload);

      setSubmitted(true);
      toast.success("Order completed!");

      // Refresh the selected batch from the server to get computed fields
      try {
        const { data: refreshedLot } = await axios.get(
          `/api/inventory/lots/${selectedBatch.lotId}`,
        );
        setSelectedBatch(refreshedLot);
      } catch {
        console.warn("Could not fetch updated lot, UI may be out of sync");
      }

      router.refresh();
      setTimeout(resetForm, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Batch
    selectedBatch,
    handleBatchChange,
    // Form
    formData,
    updateField,
    updateWeightOut,
    // Attachments
    voiceNote,
    handleVoiceRecording,
    // UI
    isSubmitting,
    submitted,
    weightAutoFilled,
    // Submit
    handleSubmit,
  };
}