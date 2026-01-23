"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { InventoryStatus, ProductType } from "@/lib/types";
import { FormData, getInitialFormData } from "../utils";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "../constants";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function ProductForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      // Envoyer les données à Airtable via l'API
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          lotId: formData.lotId,
          type: formData.type,
          quantity: parseInt(formData.quantity),
          weight: parseFloat(formData.weight),
          status: formData.status,
          arrivalDate: formData.arrivalDate,
          expiryDate: formData.expiryDate,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success("Added Successuffly");
        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          setSubmitted(false);
          setFormData(getInitialFormData());
          router.refresh(); // Rafraîchir les données
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add product");
        toast.error("Failed to add product");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium text-green-600">Product Added!</p>
        <p className="text-sm text-muted-foreground">
          Lot ID: {formData.lotId}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          placeholder="e.g. Beef Ribeye"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <CustomSelect
          id="type"
          value={formData.type}
          options={PRODUCT_TYPES}
          onChange={(value) => updateField("type", value as ProductType)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (pcs)</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="0"
            value={formData.quantity}
            onChange={(e) => updateField("quantity", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="0.0"
            value={formData.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lot ID</Label>
        <Input value={formData.lotId} disabled className="bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="arrival">Arrival Date</Label>
          <Input
            id="arrival"
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => updateField("arrivalDate", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => updateField("expiryDate", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <CustomSelect
          id="status"
          value={formData.status}
          options={PRODUCT_STATUSES}
          onChange={(value) => updateField("status", value as InventoryStatus)}
        />
      </div>

      <Button
        type="submit"
        className="w-full cursor-pointer mt-5"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding..." : "Add to Inventory"}
      </Button>
    </form>
  );
}
