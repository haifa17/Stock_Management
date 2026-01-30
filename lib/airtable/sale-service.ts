import { airtable, TABLES } from "./config";
import type { Sale } from "../types";
import { AirtableSaleFields } from "./airtable-types";

function transformSaleRecord(record: any): Sale {
  const fields = record.fields as AirtableSaleFields;
  return {
    id: record.id,
    saleId: fields.SaleId || record.id,
    lotId: fields.LotId,
    weightOut: Number(fields.WeightOut) || 0,
    pieces: Number(fields.Pieces) || 0,
    notes: fields.Notes,
    voiceNoteUrl: fields.VoiceNoteUrl,
    saleDate: fields.SaleDate,
    processedBy: fields.ProcessedBy,
  };
}
export const saleService = {
  // Create new sale
  async create(data: Omit<Sale, "id" | "saleId" | "saleDate">): Promise<Sale> {
    try {
      console.log("Creating sale with data:", data);

      // Build the record data with only required fields
      const recordData: any = {
        LotId: data.lotId,
        WeightOut: data.weightOut,
        Pieces: data.pieces,
        SaleDate: new Date().toISOString(),
      };

      // Add optional fields only if they're provided
      if (data.notes) {
        recordData.Notes = data.notes;
      }
      if (data.voiceNoteUrl) {
        recordData.VoiceNoteUrl = data.voiceNoteUrl;
      }
      if (data.processedBy) {
        recordData.ProcessedBy = data.processedBy;
      }
      console.log("Creating record with:", recordData);

      const record = await airtable(TABLES.SALES).create(recordData);
      return transformSaleRecord(record);
    } catch (error) {
      console.error("Error creating sale in Airtable:", error);
      throw error;
    }
  },

  // Get sales by lot
  async getByLot(lotId: string): Promise<Sale[]> {
    try {
      const records = await airtable(TABLES.SALES)
        .select({
          filterByFormula: `{LotId} = "${lotId}"`,
          sort: [{ field: "SaleDate", direction: "desc" }],
        })
        .all();
      return records.map(transformSaleRecord);
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
  },

  // Get all sales
  async getAll(): Promise<Sale[]> {
    try {
      const records = await airtable(TABLES.SALES)
        .select({
          sort: [{ field: "SaleDate", direction: "desc" }],
        })
        .all();
      return records.map(transformSaleRecord);
    } catch (error) {
      console.error("Error fetching all sales:", error);
      throw error;
    }
  },

  // Get sales by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    try {
      const records = await airtable(TABLES.SALES)
        .select({
          filterByFormula: `AND(
            IS_AFTER({SaleDate}, "${startDate}"),
            IS_BEFORE({SaleDate}, "${endDate}")
          )`,
          sort: [{ field: "SaleDate", direction: "desc" }],
        })
        .all();
      return records.map(transformSaleRecord);
    } catch (error) {
      console.error("Error fetching sales by date range:", error);
      throw error;
    }
  },
  // Helper: Get sales with product info (by joining with Lots)
  async getAllWithProductInfo(): Promise<Array<Sale & { product: string }>> {
    try {
      const sales = await this.getAll();
      const { lotService } = await import("./lot-service");

      // Enrich sales with product info from lots
      const enrichedSales = await Promise.all(
        sales.map(async (sale) => {
          const lot = await lotService.getByLotId(sale.lotId);
          return {
            ...sale,
            product: lot?.product || "Unknown",
          };
        }),
      );

      return enrichedSales;
    } catch (error) {
      console.error("Error fetching sales with product info:", error);
      throw error;
    }
  },
};
