import { Lot } from "../types";
import { AirtableLotFields, BatchStatus } from "./airtable-types";
import { airtable, TABLES } from "./config";

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
    qtyReceived: fields.QtyReceived || 0,
    currentStock: fields.CurrentStock || 0,
    status: fields.Status,
    notes: fields.Notes,
    voiceNoteUrl: fields.VoiceNoteUrl,
    arrivalDate: fields.ArrivalDate,
    createdBy: fields.CreatedBy,
  };
}

export const lotService = {
  // Create new lot
  async create(
    data: Omit<Lot, "id" | "arrivalDate" | "currentStock">,
  ): Promise<Lot> {
    try {
      const recordData: any = {
        LotId: data.lotId,
        Product: data.product,
        Provider: data.provider,
        Grade: data.grade,
        Brand: data.brand,
        Origin: data.origin,
        Condition: data.condition,
        ProductionDate: data.productionDate,
        QtyReceived: data.qtyReceived,
        Status: data.status || "Active",
        ArrivalDate: new Date().toISOString(),
      };

      // Add optional fields only if provided
      if (data.notes) {
        recordData.Notes = data.notes;
      }

      if (data.voiceNoteUrl) {
        recordData.VoiceNoteUrl = data.voiceNoteUrl; // Add this
      }

      if (data.createdBy) {
        recordData.CreatedBy = data.createdBy;
      }

      console.log("Creating lot record with:", recordData);

      const record = await airtable(TABLES.LOTS).create(
        recordData as AirtableLotFields,
      );
      return transformLotRecord(record);
    } catch (error) {
      console.error("Error creating lot:", error);
      throw error;
    }
  },

  // Get all active batches
  async getActiveBatches(): Promise<Lot[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{Status} = "Active"`,
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();
      return records.map(transformLotRecord);
    } catch (error) {
      console.error("Error fetching active batches:", error);
      throw error;
    }
  },

  // Get lot by LotId
  async getByLotId(lotId: string): Promise<Lot | null> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{LotId} = "${lotId}"`,
          maxRecords: 1,
        })
        .all();
      return records.length > 0 ? transformLotRecord(records[0]) : null;
    } catch (error) {
      console.error("Error fetching lot:", error);
      return null;
    }
  },

  // Get all lots
  async getAll(): Promise<Lot[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();
      return records.map(transformLotRecord);
    } catch (error) {
      console.error("Error fetching lots:", error);
      throw error;
    }
  },

  // Update stock and status
  async updateStock(lotId: string, newStock: number): Promise<void> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{LotId} = "${lotId}"`,
          maxRecords: 1,
        })
        .all();

      if (records.length > 0) {
        // Only update Status, CurrentStock is computed automatically
        await airtable(TABLES.LOTS).update(records[0].id, {
          Status: newStock <= 0 ? "Depleted" : "Active",
        });
      }
    } catch (error) {
      console.error("Error updating stock:", error);
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

  // Update lot status
  async updateStatus(lotId: string, status: BatchStatus): Promise<void> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{LotId} = "${lotId}"`,
          maxRecords: 1,
        })
        .all();

      if (records.length > 0) {
        await airtable(TABLES.LOTS).update(records[0].id, {
          Status: status,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },
};
