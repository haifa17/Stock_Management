// Types pour Airtable
// Product Types
export type ProductType = "carcass" | "primal" | "cut";
export type ProductCategory = "Beef" | "Chicken" | "Pork" | "Lamb" | "Other";

// Status Types
export type InventoryStatus = "Available" | "Reserved" | "Sold" | "Low Stock";
export type OrderStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type BatchStatus = "Active" | "Depleted" | "Expired";

// User Types
export type UserRole = "admin" | "warehouseStaff" | "marketer";

// Structure des enregistrements Airtable
// ============================================
// PRODUCTS TABLE (Master Product List)
// ============================================
export interface AirtableProductFields {
  [key: string]: any;
  Name: string; // "Brisket Flat"
  Category: ProductCategory; // "Beef"
  Type: ProductType; // "primal"
  IsEmergency?: boolean; // true if created via emergency mode
  CreatedAt: string;
  CreatedBy?: string; // User ID who created it
}



// ============================================
// LOTS/BATCHES TABLE (Inbound Records)
// ============================================
export interface AirtableLotFields {
  [key: string]: any;
  LotId: string; // "Brisket-Flat-1738012345678"
  Product: string; // Link to Products table OR product name
  Provider: string;
  Grade: string;
  Brand: string;
  Origin: string;
  Condition: string;
  ProductionDate: string;
  QtyReceived: number; // kg
  CurrentStock: number; // kg (calculated: QtyReceived - total outbound)
  Status: BatchStatus; // "Active", "Depleted", "Expired"
  Notes?: string;
  ArrivalDate: string; // Auto-generated timestamp
  CreatedBy?: string; // User ID
}



// ============================================
// SALES/OUTBOUND TABLE
// ============================================
export interface AirtableSaleFields {
  [key: string]: any;
  SaleId?: string; // Auto-generated or record ID
  LotId: string; // Link to Lots table
  WeightOut: number; // kg
  Pieces: number;
  Notes?: string;
  SaleDate: string; // Timestamp
  ProcessedBy?: string; // User ID
}

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
  Items: string | string[]; // Array de noms de produits
  TotalWeight: number;
  Status: OrderStatus;
}

