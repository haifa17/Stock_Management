// Types pour Airtable
export type ProductType = "carcass" | "primal" | "cut";
export type InventoryStatus = "Available" | "Reserved" | "Sold";
export type OrderStatus = "Pending" | "Confirmed" | "Completed";

// Structure des enregistrements Airtable
export interface AirtableInventoryFields {
  [key: string]: any;
  Name: string;
  LotId: string;
  Type: ProductType;
  Quantity: number;
  Weight: number;
  Status: InventoryStatus;
  ArrivalDate: string;
  ExpiryDate: string;
}

export interface AirtableOrderFields {
  [key: string]: any;
  OrderId: string;
  Customer: string;
  Date: string;
  Items: string | string[] // Array de noms de produits
  TotalWeight: number;
  Status: OrderStatus;
}

// Types pour l'application (après transformation)
export interface InventoryItem {
  id: string;
  name: string;
  lotId: string;
  type: ProductType;
  quantity: number;
  weight: number;
  status: InventoryStatus;
  arrivalDate: string;
  expiryDate: string;
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  items: string[];
  totalWeight: number;
  status: OrderStatus;
}
export type UserRole = "admin" | "warehouseStaff"

export interface User {
  id: string
  email: string
  role: UserRole
}

