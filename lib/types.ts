import {
  BatchStatus,
  InventoryStatus,
  OrderStatus,
  ProductCategory,
  ProductType,
  UserRole,
} from "./airtable/airtable-types";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

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
  // Additional lot fields
  provider?: string;
  grade?: string;
  brand?: string;
  origin?: string;
  condition?: string;
  qtyReceived?: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer: string;
  items: string[];
  totalWeight: number;
  status: OrderStatus;
  date: string;
}
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  type: ProductType;
  isEmergency?: boolean;
  createdAt: string;
  createdBy?: string;
}
export interface Lot {
  id: string;
  lotId: string;
  product: string;
  provider: string;
  grade: string;
  brand: string;
  origin: string;
  condition: string;
  productionDate: string;
  qtyReceived: number;
  currentStock: number;
  status: BatchStatus;
  notes?: string;
  arrivalDate: string;
  createdBy?: string;
}
export interface Sale {
  id: string;
  saleId: string;
  lotId: string;
  weightOut: number;
  pieces: number;
  notes?: string;
  saleDate: string;
  processedBy?: string;
}
