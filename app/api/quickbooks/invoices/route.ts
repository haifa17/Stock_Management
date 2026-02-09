// app/api/quickbooks/invoices/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getQuickBooksClient } from '@/lib/quickbooks/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.qb_connected || !user.qb_access_token) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    // Create QB client with stored tokens
    const qbClient = getQuickBooksClient({
      accessToken: user.qb_access_token,
      refreshToken: user.qb_refresh_token!,
      realmId: user.qb_realm_id!,
    });

    // Query invoices
    const invoices = await qbClient.queryItems(
      "SELECT * FROM Invoice MAXRESULTS 10"
    );

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.qb_connected || !user.qb_access_token) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { customerId, lines, dueDate } = body;

    const qbClient = getQuickBooksClient({
      accessToken: user.qb_access_token,
      refreshToken: user.qb_refresh_token!,
      realmId: user.qb_realm_id!,
    });

    // Create invoice
    const invoice = await qbClient.createInvoice({
      customerId,
      lines,
      dueDate,
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}