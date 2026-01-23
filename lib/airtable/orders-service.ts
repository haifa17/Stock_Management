import { airtable, TABLES } from "./config";
import type { AirtableOrderFields, Order, OrderStatus } from "./types";

// Transformer un enregistrement Airtable en Order
function transformOrderRecord(record: any): Order {
  const fields = record.fields as AirtableOrderFields;
  return {
    id: record.id,
    customer: fields.Customer,
    date: fields.Date,
    items: Array.isArray(fields.Items)
      ? fields.Items
      : typeof fields.Items === "string"
        ? fields.Items.split(",").map((i) => i.trim())
        : [],

    totalWeight: Number(fields.TotalWeight) || 0,
    status: fields.Status,
  };
}

// Service pour gérer les commandes
export const ordersService = {
  // Récupérer toutes les commandes
  async getAll(): Promise<Order[]> {
    try {
      const records = await airtable(TABLES.ORDERS)
        .select({
          sort: [{ field: "Date", direction: "desc" }],
        })
        .all();

      return records.map(transformOrderRecord);
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      throw error;
    }
  },

  // Récupérer une commande par ID
  async getById(id: string): Promise<Order | null> {
    try {
      const record = await airtable(TABLES.ORDERS).find(id);
      return transformOrderRecord(record);
    } catch (error) {
      console.error("Erreur lors de la récupération de la commande:", error);
      return null;
    }
  },

  // Créer une nouvelle commande
  async create(data: Omit<Order, "id">): Promise<Order> {
    try {
      const record = await airtable(TABLES.ORDERS).create({
        OrderId: `ORD-${Date.now()}`,
        Customer: data.customer,
        Date: data.date,
        Items: data.items,
        TotalWeight: data.totalWeight,
        Status: data.status,
      } as AirtableOrderFields);

      return transformOrderRecord(record);
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une commande
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const record = await airtable(TABLES.ORDERS).update(id, {
        Status: status,
      });

      return transformOrderRecord(record);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  },

  // Récupérer les commandes récentes
  async getRecent(limit: number = 10): Promise<Order[]> {
    try {
      const records = await airtable(TABLES.ORDERS)
        .select({
          sort: [{ field: "Date", direction: "desc" }],
          maxRecords: limit,
        })
        .all();

      return records.map(transformOrderRecord);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des commandes récentes:",
        error,
      );
      throw error;
    }
  },

  // Filtrer par statut
  async getByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const records = await airtable(TABLES.ORDERS)
        .select({
          filterByFormula: `{Status} = "${status}"`,
          sort: [{ field: "Date", direction: "desc" }],
        })
        .all();

      return records.map(transformOrderRecord);
    } catch (error) {
      console.error("Erreur lors du filtrage par statut:", error);
      throw error;
    }
  },
};
