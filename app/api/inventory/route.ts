import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/airtable/inventory-service'
import type { InventoryStatus } from '@/lib/airtable/types'

// GET - Récupérer tous les items ou filtrer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as InventoryStatus | null

    const items = status
      ? await inventoryService.getByStatus(status)
      : await inventoryService.getAll()

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Erreur GET /api/inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newItem = await inventoryService.create(body)

    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}