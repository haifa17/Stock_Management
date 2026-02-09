// lib/airtable/users.ts
import { User } from "../types";
import { airtable, TABLES } from "./config";
import { UserRole } from "./airtable-types";

interface AirtableUserFields {
  Email: string;
  Password: string;
  Role: UserRole;
  qb_access_token?: string;
  qb_refresh_token?: string;
  qb_realm_id?: string;
  qb_expires_at?: string;
  qb_connected?: boolean;
}

// Transformer un enregistrement Airtable en User (sans le mot de passe)
function transformUserRecord(record: any): User {
  const fields = record.fields as AirtableUserFields;
  return {
    id: record.id,
    email: fields.Email,
    role: fields.Role,
    qb_access_token: fields.qb_access_token,
    qb_refresh_token: fields.qb_refresh_token,
    qb_realm_id: fields.qb_realm_id,
    qb_expires_at: fields.qb_expires_at,
    qb_connected: fields.qb_connected || false,
  };
}

// Service pour gérer les utilisateurs
export const usersService = {
  // Authentifier un utilisateur
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      const records = await airtable(TABLES.USERS)
        .select({
          filterByFormula: `AND({Email} = "${email}", {Password} = "${password}")`,
          maxRecords: 1,
        })
        .all();

      if (records.length === 0) {
        return null;
      }

      return transformUserRecord(records[0]);
    } catch (error) {
      console.error("Erreur lors de l'authentification:", error);
      throw error;
    }
  },

  // Récupérer un utilisateur par email
  async getByEmail(email: string): Promise<User | null> {
    try {
      const records = await airtable(TABLES.USERS)
        .select({
          filterByFormula: `{Email} = "${email}"`,
          maxRecords: 1,
        })
        .all();

      if (records.length === 0) {
        return null;
      }

      return transformUserRecord(records[0]);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  },

  // Récupérer un utilisateur par ID
  async getById(id: string): Promise<User | null> {
    try {
      const record = await airtable(TABLES.USERS).find(id);
      return transformUserRecord(record);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  },

  // Créer un nouvel utilisateur
  async create(email: string, password: string, role: UserRole): Promise<User> {
    try {
      const records = await airtable(TABLES.USERS).create([
        {
          fields: {
            Email: email,
            Password: password,
            Role: role,
          },
        },
      ]);
      return transformUserRecord(records[0]);
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      throw error;
    }
  },

  // Vérifier si un email existe déjà
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return user !== null;
  },

  // Mettre à jour les tokens QuickBooks
  async updateQuickBooksTokens(
    userId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      realmId: string;
      expiresAt: string;
    },
  ): Promise<void> {
    try {
      await airtable(TABLES.USERS).update([
        {
          id: userId,
          fields: {
            qb_access_token: tokens.accessToken,
            qb_refresh_token: tokens.refreshToken,
            qb_realm_id: tokens.realmId,
            qb_expires_at: tokens.expiresAt,
            qb_connected: true,
          },
        },
      ]);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des tokens QuickBooks:",
        error,
      );
      throw error;
    }
  },

  // Déconnecter QuickBooks
  async disconnectQuickBooks(userId: string): Promise<void> {
    try {
      await airtable(TABLES.USERS).update([
        {
          id: userId,
          fields: {
            qb_access_token: undefined, // ← Use undefined instead of null
            qb_refresh_token: undefined, // ← Use undefined instead of null
            qb_realm_id: undefined, // ← Use undefined instead of null
            qb_expires_at: undefined, // ← Use undefined instead of null
            qb_connected: false,
          },
        },
      ]);
    } catch (error) {
      console.error("Erreur lors de la déconnexion de QuickBooks:", error);
      throw error;
    }
  },

  // Vérifier si QuickBooks est connecté
  async isQuickBooksConnected(userId: string): Promise<boolean> {
    try {
      const user = await this.getById(userId);
      return user?.qb_connected || false;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de la connexion QuickBooks:",
        error,
      );
      return false;
    }
  },
};
