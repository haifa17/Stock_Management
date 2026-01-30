export interface SaleWithProduct {
  id: string;
  saleId: string;
  lotId: string;
  product: string; // Added from Lots lookup
  weightOut: number;
  pieces: number;
  notes?: string;
  saleDate: string;
  processedBy?: string;
  voiceNoteUrl?:string
}
