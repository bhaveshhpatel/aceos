import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/signin`, 303);
  } catch (err) {
    console.error('[POST /api/auth/signout]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
