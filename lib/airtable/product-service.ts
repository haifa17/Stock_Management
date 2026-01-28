import { Product } from "../types";
import { airtable, TABLES } from "./config";
import {
  AirtableProductFields,
  ProductCategory,
  ProductType,
} from "./airtable-types";

function transformProductRecord(record: any): Product {
  const fields = record.fields as AirtableProductFields;
  return {
    id: record.id,
    name: fields.Name,
    category: fields.Category,
    type: fields.Type,
    isEmergency: fields.IsEmergency || false,
    createdAt: fields.CreatedAt,
    createdBy: fields.CreatedBy,
  };
}

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    try {
      const records = await airtable(TABLES.PRODUCTS)
        .select({ 
          sort: [{ field: "Name", direction: "asc" }] 
        })
        .all();
      return records.map(transformProductRecord);
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Get product by name
  async getByName(name: string): Promise<Product | null> {
    try {
      const records = await airtable(TABLES.PRODUCTS)
        .select({ 
          filterByFormula: `{Name} = "${name}"`,
          maxRecords: 1 
        })
        .all();
      return records.length > 0 ? transformProductRecord(records[0]) : null;
    } catch (error) {
      console.error("Error finding product:", error);
      return null;
    }
  },

  // Create new product
  async create(data: {
    name: string;
    category: ProductCategory;
    type?: ProductType;
    isEmergency?: boolean;
    createdBy?: string;
  }): Promise<Product> {
    try {
      const record = await airtable(TABLES.PRODUCTS).create({
        Name: data.name,
        Category: data.category,
        Type: data.type || "primal",
        IsEmergency: data.isEmergency || false,
        CreatedAt: new Date().toISOString(),
        CreatedBy: data.createdBy,
      } as AirtableProductFields);
      
      return transformProductRecord(record);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  // Get emergency products (for admin review)
  async getEmergencyProducts(): Promise<Product[]> {
    try {
      const records = await airtable(TABLES.PRODUCTS)
        .select({ 
          filterByFormula: `{IsEmergency} = TRUE()`,
          sort: [{ field: "CreatedAt", direction: "desc" }] 
        })
        .all();
      return records.map(transformProductRecord);
    } catch (error) {
      console.error("Error fetching emergency products:", error);
      throw error;
    }
  },

  // Update product (e.g., admin approves emergency product)
  async update(id: string, data: Partial<{
    name: string;
    category: ProductCategory;
    type: ProductType;
    isEmergency: boolean;
  }>): Promise<Product> {
    try {
      const updateData: Partial<AirtableProductFields> = {};
      
      if (data.name) updateData.Name = data.name;
      if (data.category) updateData.Category = data.category;
      if (data.type) updateData.Type = data.type;
      if (data.isEmergency !== undefined) updateData.IsEmergency = data.isEmergency;

      const record = await airtable(TABLES.PRODUCTS).update(id, updateData);
      return transformProductRecord(record);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  // Delete product
  async delete(id: string): Promise<void> {
    try {
      await airtable(TABLES.PRODUCTS).destroy(id);
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },
};