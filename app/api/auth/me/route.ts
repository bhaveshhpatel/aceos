import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { data: student } = await supabase
      .from('students')
      .select('first_name, account_status, parent_email, onboarding_completed')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user_id: user.id,
      email: user.email,
      first_name: student?.first_name,
      account_status: student?.account_status,
      parent_email: student?.parent_email,
      onboarding_completed: student?.onboarding_completed,
    });
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
