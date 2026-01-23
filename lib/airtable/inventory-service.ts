import { airtable, TABLES } from "./config";
import type {
  AirtableInventoryFields,
  InventoryItem,
  InventoryStatus,
} from "./types";

// Transformer un enregistrement Airtable en InventoryItem
function transformInventoryRecord(record: any): InventoryItem {
  const fields = record.fields as AirtableInventoryFields;

  return {
    id: record.id,
    name: fields.Name,
    lotId: fields.LotId,
    type: fields.Type,
    quantity: Number(fields.Quantity) || 0,
    weight: Number(fields.Weight) || 0,
    status: fields.Status,
    arrivalDate: fields.ArrivalDate,
    expiryDate: fields.ExpiryDate,
  };
}

// Service pour gérer l'inventaire
export const inventoryService = {
  // Récupérer tous les items
  async getAll(): Promise<InventoryItem[]> {
    try {
      const records = await airtable(TABLES.INVENTORY)
        .select({
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformInventoryRecord);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'inventaire:", error);
      throw error;
    }
  },

  // Récupérer un item par ID
  async getById(id: string): Promise<InventoryItem | null> {
    try {
      const record = await airtable(TABLES.INVENTORY).find(id);
      return transformInventoryRecord(record);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'item:", error);
      return null;
    }
  },

  // Créer un nouvel item
  async create(data: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    try {
      const record = await airtable(TABLES.INVENTORY).create({
        Name: data.name,
        LotId: data.lotId,
        Type: data.type,
        Quantity: data.quantity,
        Weight: data.weight,
        Status: data.status,
        ArrivalDate: data.arrivalDate,
        ExpiryDate: data.expiryDate,
      } as AirtableInventoryFields);

      return transformInventoryRecord(record);
    } catch (error) {
      console.error("Erreur lors de la création de l'item:", error);
      throw error;
    }
  },

  // Mettre à jour le statut d'un item
  async updateStatus(
    id: string,
    status: InventoryStatus,
  ): Promise<InventoryItem> {
    try {
      const record = await airtable(TABLES.INVENTORY).update(id, {
        Status: status,
      });

      return transformInventoryRecord(record);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  },

  // Mettre à jour un item complet
  async update(
    id: string,
    data: Partial<Omit<InventoryItem, "id">>,
  ): Promise<InventoryItem> {
    try {
      const updateData: Partial<AirtableInventoryFields> = {};

      if (data.name) updateData.Name = data.name;
      if (data.type) updateData.Type = data.type;
      if (data.quantity !== undefined) updateData.Quantity = data.quantity;
      if (data.weight !== undefined) updateData.Weight = data.weight;
      if (data.status) updateData.Status = data.status;
      if (data.arrivalDate) updateData.ArrivalDate = data.arrivalDate;
      if (data.expiryDate) updateData.ExpiryDate = data.expiryDate;

      const record = await airtable(TABLES.INVENTORY).update(id, updateData);
      return transformInventoryRecord(record);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'item:", error);
      throw error;
    }
  },

  // Supprimer un item
  async delete(id: string): Promise<void> {
    try {
      await airtable(TABLES.INVENTORY).destroy(id);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'item:", error);
      throw error;
    }
  },

  // Filtrer par statut
  async getByStatus(status: InventoryStatus): Promise<InventoryItem[]> {
    try {
      const records = await airtable(TABLES.INVENTORY)
        .select({
          filterByFormula: `{Status} = "${status}"`,
          sort: [{ field: "ArrivalDate", direction: "desc" }],
        })
        .all();

      return records.map(transformInventoryRecord);
    } catch (error) {
      console.error("Erreur lors du filtrage par statut:", error);
      throw error;
    }
  },

  // Récupérer les items en faible stock
  async getLowStock(threshold: number = 20): Promise<InventoryItem[]> {
    try {
      const records = await airtable(TABLES.INVENTORY)
        .select({
          filterByFormula: `{Quantity} < ${threshold}`,
          sort: [{ field: "Quantity", direction: "asc" }],
        })
        .all();

      return records.map(transformInventoryRecord);
    } catch (error) {
      console.error("Erreur lors de la récupération du stock faible:", error);
      throw error;
    }
  },
};
