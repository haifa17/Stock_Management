import { InventoryStatus, ProductType } from "@/lib/types";

export interface FormData {
  name: string;
  type: ProductType;
  quantity: string;
  weight: string;
  lotId: string;
  arrivalDate: string;
  expiryDate: string;
  status: InventoryStatus;
}
export function generateScanCode(): string {
  return "SCAN-" + Math.random().toString(36).substring(7).toUpperCase();
}
export function generateLotId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `LOT-${year}-${random}`;
}

export function getInitialFormData(): FormData {
  return {
    name: "",
    type: "cut",
    quantity: "",
    weight: "",
    lotId: generateLotId(),
    arrivalDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    status: "Available",
  };
}
