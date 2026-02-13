// Types pour Airtable
// Product Types
export type ProductType = "carcass" | "primal" | "cut";
export type ProductCategory = "Beef" | "Chicken" | "Pork" | "Lamb" | "Other";

// Status Types
// export type InventoryStatus =
//   | "Available"
//   | "Reserved"
//   | "Sold"
//   | "Low Stock"
//   | "Returned"
//   | "Damaged";
export type OrderStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type BatchStatus =
  | "Available" // Lot is in stock and ready for sale
  | "Sold" // Lot has been completely sold
  | "Reserved" // Lot is reserved for a specific order
  | "Damaged" // Lot is damaged and cannot be sold
  | "Returned" // Lot has been returned by customer
  | "Low Stock"; // Lot is running low (computed when Available + currentStock < 20)

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
  Type: string; // "primal"
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
  ExpirationDate: string;
  QtyReceived: number; // £
  Price: number;
  Sales?: string[]; // 🔗 linked records (array of record IDs)
  TotalSold?: number; // 📊 rollup field
  CurrentStock: number; // £ (calculated: QtyReceived - total outbound)
  Status: BatchStatus;
  Notes?: string;
  VoiceNoteUrl?: string;
  ArrivalDate: string; // Auto-generated timestamp
  CreatedBy?: string; // User ID
}

// ============================================
// SALES/OUTBOUND TABLE
// ============================================
export interface AirtableSaleFields {
  [key: string]: any;
  SaleId?: string; // Auto-generated or record ID
  LotId: string; // 📝 Text field - stores the custom lot ID string (e.g., "Rabbit987-1769700497858")
  Lots: string | string[]; // 🔗 Linked record field - links to Lots table (Airtable record ID)  WeightOut: number; // £
  Pieces: number;
  Price: number;
  Client: string;
  Notes?: string;
  VoiceNoteUrl?: string;
  SaleDate: string; // Timestamp
  ProcessedBy?: string; // User ID
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
