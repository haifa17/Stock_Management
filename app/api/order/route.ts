import { NextRequest, NextResponse } from 'next/server'
import { ordersService } from '@/lib/airtable/orders-service'
import { OrderStatus } from '@/lib/airtable/airtable-types'

// GET - Récupérer tous les items ou filtrer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as OrderStatus | null

    const items = status
      ? await ordersService.getByStatus(status)
      : await ordersService.getAll()

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Erreur GET /api/order:', error)
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
    const newItem = await ordersService.create(body)

    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/order:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}