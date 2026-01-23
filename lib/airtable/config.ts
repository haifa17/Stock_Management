import Airtable from 'airtable'

// Configuration Airtable avec Personal Access Token
export const airtableConfig = {
  personalAccessToken: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
}

// Initialiser Airtable avec le Personal Access Token
Airtable.configure({
  apiKey: airtableConfig.personalAccessToken,
})

export const airtable = Airtable.base(airtableConfig.baseId)

// Noms des tables
export const TABLES = {
  INVENTORY: 'Inventory',
  ORDERS: 'Orders',
  USERS:'Users'
} as const