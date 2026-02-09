// app/api/quickbooks/disconnect/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { usersService } from '@/lib/airtable/users-service';

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear QuickBooks tokens
    await usersService.disconnectQuickBooks(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting QB:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}