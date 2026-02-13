export interface SaleWithProduct {
  id: string;
  saleId: string;
  lotId: string;
  product: string; // Added from Lots lookup
  weightOut: number;
  price: number;
  pieces: number;
  client: string;
  notes?: string;
  saleDate: string;
  processedBy?: string;
  voiceNoteUrl?: string;
}
