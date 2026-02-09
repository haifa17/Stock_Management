// app/api/quickbooks/status/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const isConnected = user.qb_connected === true && !!user.qb_access_token;

    return NextResponse.json({
      connected: isConnected,
      realmId: user.qb_realm_id,
      expiresAt: user.qb_expires_at,
    });
  } catch (error) {
    console.error('Error checking QB status:', error);
    return NextResponse.json({ connected: false });
  }
}