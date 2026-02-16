import {
  BatchStatus,
  OrderStatus,
  ProductCategory,
  UserRole,
} from "./airtable/airtable-types";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string; // Add this
  receiveWhatsAppNotifications?: boolean; // Add this
  qb_access_token?: string;
  qb_refresh_token?: string;
  qb_realm_id?: string;
  qb_expires_at?: string;
  qb_connected?: boolean;
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
  type: string;
  isEmergency?: boolean;
  createdAt: string;
  createdBy?: string;
}
export interface Lot {
  id: string;
  lotId: string;
  product: string; // Product name
  provider: string;
  grade: string;
  brand: string;
  origin: string;
  condition: string;
  productionDate: string;
  expirationDate: string;
  price: number;
  qtyReceived: number;
  totalSold?: number;
  currentStock: number;
  status: BatchStatus;
  notes?: string;
  voiceNoteUrl?: string;
  invoiceUrl?: string;
  arrivalDate: string;
  createdBy?: string;
}
// Type alias for backwards compatibility - can be removed after full migration
export type InventoryItem = Lot;
export interface Sale {
  id: string;
  saleId: string;
  lotId: string;
  weightOut: number;
  pieces: number;
  client: string;
  price: number;
  notes?: string;
  voiceNoteUrl?: string;
  saleDate: string;
  processedBy?: string;
}
