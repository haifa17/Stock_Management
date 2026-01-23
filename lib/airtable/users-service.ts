import { airtable, TABLES } from './config'
import { User, UserRole } from './types'


interface AirtableUserFields {
  Email: string
  Password: string
  Role: UserRole
}
// Transformer un enregistrement Airtable en User (sans le mot de passe)
function transformUserRecord(record: any): User {
  const fields = record.fields as AirtableUserFields
  return {
    id: record.id,
    email: fields.Email,
    role: fields.Role,
  }
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
        .all()

      if (records.length === 0) {
        return null
      }

      return transformUserRecord(records[0])
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error)
      throw error
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
        .all()

      if (records.length === 0) {
        return null
      }

      return transformUserRecord(records[0])
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return null
    }
  },

  // Créer un nouvel utilisateur
  async create(email: string, password: string, role: UserRole): Promise<User> {
    try {
     const record = await airtable(TABLES.USERS).create([
        {
          fields: {
            Email: email,
            Password: password,
            Role: role,
          }
        }
      ])
      return transformUserRecord(record)
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      throw error
    }
  },

  // Vérifier si un email existe déjà
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getByEmail(email)
    return user !== null
  },
}