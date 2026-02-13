"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "./Voicerecorder";
import axios from "axios";

interface InboundFormProps {
  scannedProduct?: string;
  products?: Product[];
}

export function InboundForm({ scannedProduct, products }: InboundFormProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const selectedProduct =
    products?.find((p) => p.id === selectedProductId) || null;
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);

  const [isEmergencyProduct, setIsEmergencyProduct] = useState(false);
  const [emergencyProductData, setEmergencyProductData] = useState({
    name: "",
    category: "",
    type: "",
  });
  const [formData, setFormData] = useState({
    provider: "",
    grade: "",
    brand: "",
    origin: "",
    condition: "",
    productionDate: "",
    expirationDate: "",
    price: "",
    qtyReceived: "",
    notes: "",
  });
  const [lotId, setLotId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      const timestamp = Date.now();
      setLotId(`${selectedProduct.name}-${timestamp}`);
    }
  }, [selectedProduct]);

  // Handle scanned product
  useEffect(() => {
    if (scannedProduct) {
      const foundProduct = products?.find((p) => p.name === scannedProduct);
      if (foundProduct) {
        setSelectedProductId(foundProduct.id);
        setIsEmergencyProduct(false);
        toast.success(`Product "${scannedProduct}" selected!`);
      } else {
        // Product NOT found - trigger emergency mode
        setIsEmergencyProduct(true);
        setSelectedProductId("");
        setEmergencyProductData({
          name: scannedProduct,
          category: "",
          type: "",
        });
        toast.warning(
          `Product "${scannedProduct}" not found. Creating emergency product...`,
        );
      }
    }
  }, [scannedProduct, products]);

  // Manual trigger for emergency product
  const handleEmergencyMode = () => {
    setIsEmergencyProduct(true);
    setSelectedProductId("");
    setEmergencyProductData({ name: "", category: "", type: "" });
  };
  const handleVoiceRecording = (blob: Blob) => {
    setVoiceNote(blob.size > 0 ? blob : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let productToUse = selectedProduct?.name;
      // If emergency product, create it first
      if (isEmergencyProduct) {
        const { data: emergencyData } = await axios.post(
          "/api/products/emergency",
          {
            name: emergencyProductData.name,
            category: emergencyProductData.category,
            type: emergencyProductData.type,
            alertAdmin: true, // Trigger admin notification
          },
        );
        if (!emergencyData) {
          toast.error("Failed to create emergency product");
          setIsSubmitting(false);
          return;
        }
        productToUse = emergencyData.name;
        // toast.info("Admin has been alerted about this new product");
      }
      const currentLotId = lotId || `${productToUse}-${Date.now()}`;
      // Continue with inbound creation
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("product", productToUse!);
      formDataToSend.append("lotId", currentLotId);
      formDataToSend.append("provider", formData.provider);
      formDataToSend.append("grade", formData.grade);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("origin", formData.origin);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("productionDate", formData.productionDate);
      formDataToSend.append("expirationDate", formData.expirationDate);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("qtyReceived", formData.qtyReceived);
      formDataToSend.append("notes", formData.notes);

      if (voiceNote) {
        console.log("Appending voice note to FormData");
        formDataToSend.append("voiceNote", voiceNote, "voice-note.webm");
      } else {
        console.log("No voice note to append");
      }

      // Log FormData contents
      console.log("FormData contents:");
      for (const [key, value] of formDataToSend.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof Blob ? `Blob(${value.size} bytes)` : value,
        );
      }
      console.log("Sending request to /api/inventory/inbound");
      const { data: responseData } = await axios.post(
        "/api/inventory/inbound",
        formDataToSend,
      );
      console.log("Inbound response:", responseData);
      setSubmitted(true);
      toast.success("Arrival confirmed!");
      router.refresh();
      setTimeout(() => {
        setSubmitted(false);
        setSelectedProductId("");
        setIsEmergencyProduct(false);
        setEmergencyProductData({ name: "", category: "", type: "" });
        setFormData({
          provider: "",
          grade: "",
          brand: "",
          origin: "",
          condition: "",
          productionDate: "",
          expirationDate: "",
          price: "",
          qtyReceived: "",
          notes: "",
        });
        setVoiceNote(null);
        setLotId("");
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
        <p className="text-lg font-medium text-green-600">Arrival Confirmed!</p>
        <p className="text-sm text-muted-foreground">Lot ID: {lotId}</p>
      </div>
    );
  }

  const productOptions = products!.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Emergency Product Alert */}
      {isEmergencyProduct && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ Emergency Product Creation
          </p>
          {/* <p className="text-xs text-amber-600 mt-1">
            Admin will be notified about this new product
          </p> */}
        </div>
      )}

      {/* Product Selection OR Emergency Product Fields */}
      {!isEmergencyProduct ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="product">Product Name</Label>
            <CustomSelect
              id="product"
              value={selectedProductId}
              options={productOptions}
              onChange={(value) => setSelectedProductId(value)}
            />
            {selectedProductId === "" && (
              <p className="text-sm text-muted-foreground">
                Can't find the product? Use the emergency button below.
              </p>
            )}
          </div>

          {/* Manual Emergency Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleEmergencyMode}
            disabled={isSubmitting}
            className="w-full cursor-pointer border-red-500 text-red-500 hover:bg-amber-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Create Emergency Product
          </Button>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-2 items-center">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Product Name</Label>
            <Input
              id="emergencyName"
              placeholder="Enter new product name"
              value={emergencyProductData.name}
              onChange={(e) =>
                setEmergencyProductData({
                  ...emergencyProductData,
                  name: e.target.value,
                })
              }
              required
              disabled={isSubmitting}
              className="border-amber-300 bg-amber-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyCategory">Category</Label>
            <Input
              id="emergencyCategory"
              placeholder="e.g., Beef, Chicken, Pork"
              value={emergencyProductData.category}
              onChange={(e) =>
                setEmergencyProductData({
                  ...emergencyProductData,
                  category: e.target.value,
                })
              }
              required
              disabled={isSubmitting}
              className="border-amber-300 bg-amber-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyType">Type</Label>
            <Input
              id="emergencyType"
              placeholder="e.g., Cut,Primal"
              value={emergencyProductData.type}
              onChange={(e) =>
                setEmergencyProductData({
                  ...emergencyProductData,
                  type: e.target.value,
                })
              }
              required
              disabled={isSubmitting}
              className="border-amber-300 bg-amber-50"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEmergencyProduct(false);
              setEmergencyProductData({ name: "", category: "", type: "" });
            }}
            disabled={isSubmitting}
            className="mt-5"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Digital Clipboard Fields */}
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Input
          id="provider"
          placeholder="Provider name"
          value={formData.provider}
          onChange={(e) =>
            setFormData({ ...formData, provider: e.target.value })
          }
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">Grade</Label>
        <Input
          id="grade"
          placeholder="e.g. Premium, Standard"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          placeholder="Brand name"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="origin">Origin</Label>
        <Input
          id="origin"
          placeholder="Country/Region of origin"
          value={formData.origin}
          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Input
          id="condition"
          placeholder="Product condition"
          value={formData.condition}
          onChange={(e) =>
            setFormData({ ...formData, condition: e.target.value })
          }
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Production Date */}
      <div className="space-y-2">
        <Label htmlFor="productionDate">Production Date</Label>
        <Input
          id="productionDate"
          type="date"
          value={formData.productionDate}
          onChange={(e) =>
            setFormData({ ...formData, productionDate: e.target.value })
          }
          required
          disabled={isSubmitting}
        />
      </div>
      {/* Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="expirationDate">Expiration Date</Label>
        <Input
          id="expirationDate"
          type="date"
          value={formData.expirationDate}
          onChange={(e) =>
            setFormData({ ...formData, expirationDate: e.target.value })
          }
          required
          disabled={isSubmitting}
        />
      </div>
      {/* Quantity Received (Big Pad) */}
      <div className="space-y-2">
        <Label htmlFor="qtyReceived">Qty Received (£)</Label>
        <Input
          id="qtyReceived"
          type="number"
          step="0.1"
          placeholder="0"
          value={formData.qtyReceived}
          onChange={(e) =>
            setFormData({ ...formData, qtyReceived: e.target.value })
          }
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base" // "Big Pad" styling
        />
      </div>
      {/* price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input
          id="price"
          type="number"
          step="0.1"
          placeholder="0"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          disabled={isSubmitting}
          className="text-2xl py-6 placeholder:text-base" // "Big Pad" styling
        />
      </div>

      {/* Voice Memo */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
      {/* Lot ID */}
      <div className="space-y-2">
        <Label>Lot ID (Auto-generated)</Label>
        <Input value={lotId} disabled className="bg-muted" />
      </div>

      <Button
        type="submit"
        className="w-full cursor-pointer mt-5"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Confirming..." : "Confirm Arrival"}
      </Button>
    </form>
  );
}
