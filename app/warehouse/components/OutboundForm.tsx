"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Lot } from "@/lib/types";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "./Voicerecorder";

interface OutboundFormProps {
  scannedBatch?: string;
  batches: Lot[];
}

export function OutboundForm({ scannedBatch, batches }: OutboundFormProps) {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<Lot | null>(null);
  const [weightOut, setWeightOut] = useState("");
  const [pieces, setPieces] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);

  // Set default selected batch on mount
  useEffect(() => {
    if (batches.length > 0 && !selectedBatch && !scannedBatch) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch, scannedBatch]);

  // Handle scanned batch
  useEffect(() => {
    if (scannedBatch) {
      const batch = batches.find((b) => b.lotId === scannedBatch);
      if (batch) {
        setSelectedBatch(batch);
        toast.success(`Batch "${scannedBatch}" selected!`);
      } else {
        toast.error("Batch not found in active lots");
      }
    }
  }, [scannedBatch, batches]);
  const handleVoiceRecording = (blob: Blob) => {
    setVoiceNote(blob.size > 0 ? blob : null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("batchId", selectedBatch.lotId);
      formData.append("weightOut", weightOut);
      formData.append("pieces", pieces);

      if (voiceNote) {
        formData.append("voiceNote", voiceNote, "voice-note.webm");
      } else {
        console.log("No voice note to append");
      }
      if (notes) {
        formData.append("notes", notes);
      } else {
        console.log("No voice note to append");
      }
      const res = await fetch("/api/inventory/outbound", {
        method: "POST",
        body: formData,
      });
      const responseData = await res.json();
      console.log("Response data:", responseData);
      if (res.ok) {
        setSubmitted(true);
        toast.success("Order completed!");
        // Update the selected batch with the new stock from response
        if (responseData.remainingStock !== undefined) {
          setSelectedBatch((prev) =>
            prev
              ? {
                  ...prev,
                  currentStock: responseData.remainingStock,
                }
              : null,
          );
        }

        // Also refresh the page data
        router.refresh();
        setTimeout(() => {
          setSubmitted(false);
          setSelectedBatch(null);
          setWeightOut("");
          setPieces("");
          setNotes("");
          setVoiceNote(null);
        }, 2000);
      } else {
        toast.error(responseData.error || "Failed to complete order");
        console.error("API Error:", responseData);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium text-green-600">Order Completed!</p>
        <p className="text-sm text-muted-foreground">
          Batch: {selectedBatch?.lotId}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Current stock automatically updated
        </p>
      </div>
    );
  }

  const batchOptions = batches.map((b) => ({
    value: b.lotId,
    label: `${b.lotId} (${b.product})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Lot/Batch Selection */}
      <div className="space-y-2">
        <Label htmlFor="batch">Lot/Batch</Label>
        <CustomSelect
          id="batch"
          value={selectedBatch ? selectedBatch.lotId : ""}
          options={batchOptions}
          onChange={(value) => {
            const batch = batches.find((b) => b.lotId === value);
            if (batch) {
              setSelectedBatch(batch);
            }
          }}
        />
        {selectedBatch && (
          <p className="text-sm text-muted-foreground">
            Available: {selectedBatch.currentStock} kg
          </p>
        )}
      </div>

      {/* Catch Weight Entry */}
      <div className="space-y-2">
        <Label htmlFor="weightOut">Weight Out (kg)</Label>
        <Input
          id="weightOut"
          type="number"
          step="0.1"
          placeholder="0.0"
          value={weightOut}
          onChange={(e) => setWeightOut(e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6" // "Big Pad" styling
        />
      </div>

      {/* Pieces */}
      <div className="space-y-2">
        <Label htmlFor="pieces">Pieces</Label>
        <Input
          id="pieces"
          type="number"
          placeholder="0"
          value={pieces}
          onChange={(e) => setPieces(e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6" // "Big Pad" styling
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="Add any notes about this batch..."
        />
      </div>
      {/* Voice Memo (Optional) */}
      <div className="space-y-2">
        <Label>Voice Note (optional)</Label>
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecording}
          disabled={isSubmitting}
        />
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
