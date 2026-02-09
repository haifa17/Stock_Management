// app/api/quickbooks/connect/route.ts
import { redirect } from 'next/navigation';
import { getQuickBooksClient } from '@/lib/quickbooks/client';

export async function GET(request: Request) {
  const qbClient = getQuickBooksClient();
  
  // Generate random state for security
  const state = Math.random().toString(36).substring(7);
  
  // Get authorization URL
  const authUrl = qbClient.getAuthorizationUrl(state);
  
  console.log('📊 Redirecting to QuickBooks authorization...');
  console.log('Auth URL:', authUrl);
  
  // redirect() throws an error internally - this is expected Next.js behavior
  redirect(authUrl);
}