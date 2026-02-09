// app/api/quickbooks/callback/route.ts
import { NextResponse } from 'next/server';
import { getQuickBooksClient } from '@/lib/quickbooks/client';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { usersService } from '@/lib/airtable/users-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const error = searchParams.get('error');

  console.log('📊 Callback received:', { code: code?.substring(0, 20), realmId, error });

  if (error) {
    console.error('QuickBooks OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/quickbook?qb_error=${error}`, request.url)
    );
  }

  if (!code || !realmId) {
    console.error('Missing parameters:', { code: !!code, realmId: !!realmId });
    return NextResponse.redirect(
      new URL('/quickbook?qb_error=missing_params', request.url)
    );
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL('/quickbook?qb_error=unauthorized', request.url)
      );
    }

    console.log('📊 Exchanging code for tokens...');

    // Exchange code for tokens
    const qbClient = getQuickBooksClient();
    const tokens = await qbClient.getTokens(code, realmId);

    console.log('✅ QuickBooks tokens obtained successfully');

    // Calculate token expiration (typically 1 hour from now)
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Save tokens to Airtable using the updated service
    await usersService.updateQuickBooksTokens(user.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      realmId: tokens.realmId,
      expiresAt: expiresAt.toISOString(),
    });

    console.log('✅ QuickBooks tokens saved to Airtable');

    return NextResponse.redirect(
      new URL('/quickbook?qb_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('❌ Error in QuickBooks callback:', error);
    console.error('Error details:', error.response?.data || error.message);
    return NextResponse.redirect(
      new URL('/quickbook?qb_error=token_exchange_failed', request.url)
    );
  }
}