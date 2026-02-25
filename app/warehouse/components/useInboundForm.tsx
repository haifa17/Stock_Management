"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import { Product } from "@/lib/types";

export interface FormData {
  provider: string;
  grade: string;
  brand: string;
  origin: string;
  condition: string;
  productionDate: string;
  expirationDate: string;
  price: string;
  qtyReceived: string;
  notes: string;
}

export interface EmergencyProductData {
  name: string;
  category: string;
  type: string;
}

const EMPTY_FORM: FormData = {
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
};

const EMPTY_EMERGENCY: EmergencyProductData = {
  name: "",
  category: "",
  type: "",
};

interface UseInboundFormProps {
  scannedProduct?: string;
  products?: Product[];
  detectedWeight?: { weight: number; unit: string } | null;
}

export function useInboundForm({
  scannedProduct,
  products,
  detectedWeight,
}: UseInboundFormProps) {
  const router = useRouter();

  // Product selection
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = products?.find((p) => p.id === selectedProductId) ?? null;

  // Emergency mode
  const [isEmergencyProduct, setIsEmergencyProduct] = useState(false);
  const [emergencyProductData, setEmergencyProductData] = useState<EmergencyProductData>(EMPTY_EMERGENCY);

  // Form fields
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [lotId, setLotId] = useState("");

  // Attachments
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weightAutoFilled, setWeightAutoFilled] = useState(false);

  // Auto-generate lot ID when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setLotId(`${selectedProduct.name}-${Date.now()}`);
    }
  }, [selectedProduct]);

  // Handle scanned product
  useEffect(() => {
    if (!scannedProduct) return;
    const found = products?.find((p) => p.name === scannedProduct);
    if (found) {
      setSelectedProductId(found.id);
      setIsEmergencyProduct(false);
      toast.success(`Product "${scannedProduct}" selected!`);
    } else {
      setIsEmergencyProduct(true);
      setSelectedProductId("");
      setEmergencyProductData({ ...EMPTY_EMERGENCY, name: scannedProduct });
      toast.success("Creating emergency product...");
    }
  }, [scannedProduct, products]);

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
    setFormData((prev) => ({ ...prev, qtyReceived: weightInLbs.toFixed(2) }));
    setWeightAutoFilled(true);
  }, [detectedWeight]);

  // Emergency mode handlers
  const enableEmergencyMode = () => {
    setIsEmergencyProduct(true);
    setSelectedProductId("");
    setEmergencyProductData(EMPTY_EMERGENCY);
  };

  const cancelEmergencyMode = () => {
    setIsEmergencyProduct(false);
    setEmergencyProductData(EMPTY_EMERGENCY);
  };

  // Voice note
  const handleVoiceRecording = (blob: Blob) => {
    setVoiceNote(blob.size > 0 ? blob : null);
  };

  // Invoice upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image (JPG, PNG) or PDF file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setInvoiceFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setInvoicePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setInvoicePreview(null);
    }

    toast.success("Invoice uploaded successfully");
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Form field helpers
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQtyReceived = (value: string) => {
    updateField("qtyReceived", value);
    setWeightAutoFilled(false);
  };

  // Reset everything
  const resetForm = () => {
    setSubmitted(false);
    setSelectedProductId("");
    setIsEmergencyProduct(false);
    setEmergencyProductData(EMPTY_EMERGENCY);
    setFormData(EMPTY_FORM);
    setVoiceNote(null);
    setInvoiceFile(null);
    setInvoicePreview(null);
    setLotId("");
    setWeightAutoFilled(false);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let productName = selectedProduct?.name;

      if (isEmergencyProduct) {
        const { data } = await axios.post("/api/products/emergency", {
          ...emergencyProductData,
          alertAdmin: true,
        });
        if (!data) {
          toast.error("Failed to create emergency product");
          return;
        }
        productName = data.name;
      }

      const currentLotId = lotId || `${productName}-${Date.now()}`;
      const payload = new FormData();

      payload.append("product", productName!);
      payload.append("lotId", currentLotId);

      (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
        payload.append(key, formData[key]);
      });

      if (voiceNote) payload.append("voiceNote", voiceNote, "voice-note.webm");
      if (invoiceFile) payload.append("invoice", invoiceFile);

      await axios.post("/api/inventory/inbound", payload);

      setSubmitted(true);
      toast.success("Arrival confirmed!");
      router.refresh();

      setTimeout(resetForm, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Product
    selectedProductId,
    setSelectedProductId,
    selectedProduct,
    // Emergency
    isEmergencyProduct,
    emergencyProductData,
    setEmergencyProductData,
    enableEmergencyMode,
    cancelEmergencyMode,
    // Form
    formData,
    updateField,
    updateQtyReceived,
    lotId,
    // Attachments
    voiceNote,
    handleVoiceRecording,
    invoiceFile,
    invoicePreview,
    fileInputRef,
    handleFileUpload,
    removeInvoice,
    // UI
    isSubmitting,
    submitted,
    weightAutoFilled,
    // Submit
    handleSubmit,
  };
}