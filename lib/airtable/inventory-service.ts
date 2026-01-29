import { airtable, TABLES } from "./config";
import { AirtableLotFields, BatchStatus } from "./airtable-types";

// Transform lot record to match your existing InventoryItem structure
function transformLotToInventoryItem(record: any): any {
  const fields = record.fields as AirtableLotFields;
  const batchStatus = fields.Status as BatchStatus;
  let status = mapBatchStatusToInventoryStatus(batchStatus);

  // Apply low stock condition
  if (batchStatus === "Active" && fields.CurrentStock < 20) {
    status = "Low Stock";
  }

  return {
    id: record.id,
    lotId: fields.LotId,
    name: fields.Product,
    quantity: Number(fields.CurrentStock),
    status,
    arrivalDate: fields.ArrivalDate
      ? new Date(fields.ArrivalDate).toLocaleDateString()
      : "",
    expiryDate: fields.ProductionDate
      ? new Date(fields.ProductionDate).toLocaleDateString()
      : "",
    // Additional lot fields
    provider: fields.Provider,
    grade: fields.Grade,
    brand: fields.Brand,
    origin: fields.Origin,
    condition: fields.Condition,
    qtyReceived: fields.QtyReceived,
    notes: fields.Notes,
  };
}

// Map BatchStatus to InventoryStatus
function mapBatchStatusToInventoryStatus(batchStatus: BatchStatus): string {
  switch (batchStatus) {
    case "Active":
      return "Available";
    case "Depleted":
      return "Sold";
    case "Expired":
      return "Reserved"; // or create a new status
    default:
      return "Available";
  }
}

export const inventoryService = {
  // Get all lots as inventory items
  async getAll(): Promise<any[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformLotToInventoryItem);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      throw error;
    }
  },

  // Get lot by ID
  async getById(id: string): Promise<any | null> {
    try {
      const record = await airtable(TABLES.LOTS).find(id);
      return transformLotToInventoryItem(record);
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  },

  // Update lot status
  async updateStatus(id: string, status: string): Promise<any> {
    try {
      // Map inventory status back to batch status
      let batchStatus: BatchStatus = "Active";
      if (status === "Sold") batchStatus = "Depleted";
      if (status === "Reserved") batchStatus = "Expired";
      console.log("Updating Airtable:", id, batchStatus);

      const record = await airtable(TABLES.LOTS).update(id, {
        Status: batchStatus,
      });

      return transformLotToInventoryItem(record);
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  // Get by status
  async getByStatus(status: string): Promise<any[]> {
    try {
      // Map inventory status to batch status
      let batchStatus: BatchStatus = "Active";
      if (status === "Sold") batchStatus = "Depleted";
      if (status === "Reserved") batchStatus = "Expired";

      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `{Status} = "${batchStatus}"`,
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformLotToInventoryItem);
    } catch (error) {
      console.error("Error filtering by status:", error);
      throw error;
    }
  },

  // Get low stock lots
  async getLowStock(threshold: number = 20): Promise<any[]> {
    try {
      const records = await airtable(TABLES.LOTS)
        .select({
          filterByFormula: `AND({Status} = "Active", {CurrentStock} < ${threshold})`,
          sort: [{ field: "CurrentStock", direction: "asc" }],
        })
        .all();

      return records.map(transformLotToInventoryItem);
    } catch (error) {
      console.error("Error fetching low stock:", error);
      throw error;
    }
  },
};
