/**
 * Script pour tester la connexion Airtable
 * Usage: npx tsx scripts/test-airtable.ts
 */

import Airtable from 'airtable'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
const BASE_ID = process.env.AIRTABLE_BASE_ID

console.log('🔍 Test de connexion Airtable\n')

// Vérifier les variables d'environnement
if (!TOKEN) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN non défini dans .env.local')
  process.exit(1)
}

if (!BASE_ID) {
  console.error('❌ AIRTABLE_BASE_ID non défini dans .env.local')
  process.exit(1)
}

console.log('✅ Variables d\'environnement trouvées')
console.log(`   Token: ${TOKEN.substring(0, 10)}...`)
console.log(`   Base ID: ${BASE_ID}\n`)

// Configurer Airtable
Airtable.configure({ apiKey: TOKEN })
const base = Airtable.base(BASE_ID)

async function testConnection() {
  try {
    console.log('📡 Test de connexion à la table Inventory...')
    
    // Tenter de lire les 3 premiers enregistrements
    const records = await base('Inventory')
      .select({ maxRecords: 3 })
      .all()

    console.log(`✅ Connexion réussie !`)
    console.log(`   ${records.length} enregistrement(s) trouvé(s)\n`)

    // Afficher les enregistrements
    if (records.length > 0) {
      console.log('📋 Exemples d\'enregistrements :\n')
      records.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.fields.Name || 'Sans nom'}`)
        console.log(`      Lot ID: ${record.fields.LotId || 'N/A'}`)
        console.log(`      Type: ${record.fields.Type || 'N/A'}`)
        console.log(`      Status: ${record.fields.Status || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('⚠️  Aucun enregistrement trouvé. Votre table est vide.\n')
    }

    // Tester la table Orders
    console.log('📡 Test de connexion à la table Orders...')
    const ordersRecords = await base('Orders')
      .select({ maxRecords: 1 })
      .all()

    console.log(`✅ Table Orders accessible`)
    console.log(`   ${ordersRecords.length} commande(s) trouvée(s)\n`)

    console.log('🎉 Tous les tests sont passés avec succès !')
    
  } catch (error: any) {
    console.error('❌ Erreur de connexion :\n')
    
    if (error.statusCode === 401) {
      console.error('   → Token invalide ou expiré')
      console.error('   → Générez un nouveau Personal Access Token sur :')
      console.error('      https://airtable.com/create/tokens')
    } else if (error.statusCode === 404) {
      console.error('   → Base ID incorrect ou table introuvable')
      console.error('   → Vérifiez votre Base ID et les noms de tables')
    } else if (error.statusCode === 403) {
      console.error('   → Permissions insuffisantes')
      console.error('   → Assurez-vous que votre token a les scopes :')
      console.error('      - data.records:read')
      console.error('      - data.records:write')
    } else {
      console.error(`   → ${error.message}`)
    }
    
    console.error('\n📖 Consultez le guide : AIRTABLE_SETUP.md')
    process.exit(1)
  }
}

// Exécuter le test
testConnection()