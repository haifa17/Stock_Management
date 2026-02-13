import { airtable, TABLES } from "./config";
import { AirtableLotFields, BatchStatus } from "./airtable-types";
import { Lot } from "../types";

function transformLotRecord(record: any): Lot {
  const fields = record.fields as AirtableLotFields;
  return {
    id: record.id,
    lotId: fields.LotId,
    product: fields.Product,
    provider: fields.Provider,
    grade: fields.Grade,
    brand: fields.Brand,
    origin: fields.Origin,
    condition: fields.Condition,
    productionDate: fields.ProductionDate,
    expirationDate: fields.ExpirationDate,
    price: fields.Price,
    qtyReceived: fields.QtyReceived || 0,
    currentStock: fields.CurrentStock || 0,
    totalSold: fields.TotalSold || 0,
    status: fields.Status,
    notes: fields.Notes,
    voiceNoteUrl: fields.VoiceNoteUrl,
    arrivalDate: fields.ArrivalDate,
    createdBy: fields.CreatedBy,
  };
}

export const inventoryService = {
  // Get all lots (inventory)
  async getAll(): Promise<Lot[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformLotRecord);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      throw error;
    }
  },

  // Get lot by ID
  async getById(id: string): Promise<Lot | null> {
    try {
      const record = await airtable(TABLES.LOTS).find(id);
      return transformLotRecord(record);
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  },

  // Update lot status
  async updateStatus(id: string, status: BatchStatus): Promise<Lot> {
    try {
      const record = await airtable(TABLES.LOTS).update(id, {
        Status: status,
      });

      return transformLotRecord(record);
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  // Get by status
  async getByStatus(status: BatchStatus): Promise<Lot[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{Status} = "${status}"`,
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformLotRecord);
    } catch (error) {
      console.error("Error filtering by status:", error);
      throw error;
    }
  },

  // Get low stock lots
  async getLowStock(threshold: number = 20): Promise<Lot[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `AND({Status} = "Active", {CurrentStock} < ${threshold})`,
          sort: [{ field: "CurrentStock", direction: "asc" }],
        })
        .all();

      return records.map(transformLotRecord);
    } catch (error) {
      console.error("Error fetching low stock:", error);
      throw error;
    }
  },
};