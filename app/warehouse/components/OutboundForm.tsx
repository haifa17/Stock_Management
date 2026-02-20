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
import axios from "axios";

interface OutboundFormProps {
  scannedBatch?: string;
  batches: Lot[];
  detectedWeight?: { weight: number; unit: string } | null;
}

export function OutboundForm({
  scannedBatch,
  batches,
  detectedWeight,
}: OutboundFormProps) {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<Lot | null>(null);
  const [weightOut, setWeightOut] = useState("");
  const [pieces, setPieces] = useState("");
  const [client, setClient] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
  const [weightAutoFilled, setWeightAutoFilled] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [sellerEIN, setSellerEIN] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [credits, setCredits] = useState("");
  const [bankName, setBankName] = useState("");
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [freightCharge, setFreightCharge] = useState("");
  const [fuelSurcharge, setFuelSurcharge] = useState("");
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
  useEffect(() => {
    if (detectedWeight) {
      // Convert to pounds if needed (assuming your system uses LBS)
      let weightInLbs = detectedWeight.weight;

      if (detectedWeight.unit === "KG" || detectedWeight.unit === "KGSS") {
        weightInLbs = detectedWeight.weight * 2.20462; // Convert KG to LBS
        toast.success(
          `Weight detected: ${detectedWeight.weight} ${detectedWeight.unit} (converted to ${weightInLbs.toFixed(2)} LBS)`,
        );
      } else {
        toast.success(
          `Weight detected: ${detectedWeight.weight} ${detectedWeight.unit}`,
        );
      }

      // Check if weight exceeds available stock
      if (selectedBatch && weightInLbs > selectedBatch.currentStock) {
        toast.warning(
          `Detected weight (${weightInLbs.toFixed(2)} lb) exceeds available stock (${selectedBatch.currentStock} lb)`,
        );
      }

      // Auto-fill the weightOut field
      setWeightOut(weightInLbs.toFixed(2));
      setWeightAutoFilled(true);
    }
  }, [detectedWeight, selectedBatch]);
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
      formData.append("client", client);
      formData.append("price", price);
      if (paymentTerms) formData.append("paymentTerms", paymentTerms);
      if (sellerEIN) formData.append("sellerEIN", sellerEIN);
      if (previousBalance) formData.append("previousBalance", previousBalance);
      if (credits) formData.append("credits", credits);
      if (bankName) formData.append("bankName", bankName);
      if (routing) formData.append("routing", routing);
      if (account) formData.append("account", account);
      if (freightCharge) formData.append("freightCharge", freightCharge);
      if (fuelSurcharge) formData.append("fuelSurcharge", fuelSurcharge);
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
      const { data: responseData } = await axios.post(
        "/api/inventory/outbound",
        formData,
      );
      console.log("Response data:", responseData);

      setSubmitted(true);
      toast.success("Order completed!");
      // Update the selected batch with the new stock from response
      // 🔹 Fetch the updated lot from Airtable to get computed fields
      try {
        const { data: refreshedLot } = await axios.get(
          `/api/inventory/lots/${selectedBatch.lotId}`,
        );
        setSelectedBatch(refreshedLot); // update UI
      } catch (err) {
        console.warn("Could not fetch updated lot, UI may be out of sync", err);
      }
      // Also refresh the page data
      router.refresh();
      setTimeout(() => {
        setSubmitted(false);
        setSelectedBatch(null);
        setWeightOut("");
        setPieces("");
        setNotes("");
        setClient("");
        setPrice("");
        setVoiceNote(null);
        setWeightAutoFilled(false);
        setPaymentTerms("");
        setSellerEIN("");
        setPreviousBalance("");
        setCredits("");
        setBankName("");
        setRouting("");
        setAccount("");
        setFreightCharge("");
        setFuelSurcharge("");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "Connection error");
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
            Available: {selectedBatch.currentStock} lb
          </p>
        )}
      </div>

      {/* Catch Weight Entry */}
      <div className="space-y-2">
        <Label htmlFor="weightOut" className="flex items-center gap-2">
          Weight Out (lb)
          {weightAutoFilled && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
              ⚖️ Auto-filled from scanner
            </span>
          )}
        </Label>
        <Input
          id="weightOut"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          max={selectedBatch?.currentStock}
          value={weightOut}
          onChange={(e) => {
            setWeightOut(e.target.value);
            setWeightAutoFilled(false);
          }}
          required
          disabled={isSubmitting}
          className={`text-2xl py-6 placeholder:text-base ${
            weightAutoFilled ? "border-green-500 bg-green-50" : ""
          }`}
        />
      </div>
      {/* Pieces */}
      <div className="space-y-2">
        <Label htmlFor="pieces">Pieces</Label>
        <Input
          id="pieces"
          type="number"
          placeholder="0"
          min="0"
          value={pieces}
          onChange={(e) => setPieces(e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base" // "Big Pad" styling
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client">Client Name</Label>
        <Input
          id="client"
          placeholder="Client name"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      {/* price */}
      <div className="space-y-2">
        <Label htmlFor="price">Proposed Sales Price ($)</Label>
        <Input
          id="price"
          type="number"
          step="0.1"
          placeholder="0"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base" // "Big Pad" styling
        />
      </div>
      {/* Surcharges */}
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
              onChange={(e) => setFreightCharge(e.target.value)}
              disabled={isSubmitting}
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
              onChange={(e) => setFuelSurcharge(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
      {/* Payment Terms */}
      <div className="space-y-2">
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Input
          id="paymentTerms"
          placeholder="e.g. Net 30, COD"
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Seller EIN */}
      <div className="space-y-2">
        <Label htmlFor="sellerEIN">Seller EIN</Label>
        <Input
          id="sellerEIN"
          placeholder="XX-XXXXXXX"
          value={sellerEIN}
          onChange={(e) => setSellerEIN(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Previous Balance & Credits — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="previousBalance">Previous Balance ($)</Label>
          <Input
            id="previousBalance"
            type="number"
            step="0.01"
            placeholder="0.00"
            min="0"
            value={previousBalance}
            onChange={(e) => setPreviousBalance(e.target.value)}
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
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Banking Info */}
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
              onChange={(e) => setBankName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="routing">Routing #</Label>
              <Input
                id="routing"
                placeholder="000000000"
                value={routing}
                onChange={(e) => setRouting(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Account #</Label>
              <Input
                id="account"
                placeholder="Account number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
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
