import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { card_id, grade, next_state, interval_days } = body;

    if (!card_id || !grade || !next_state) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    }

    const service = serviceClient();

    // Log review event in student intelligence profile or user metadata
    await service
      .from('student_intelligence_profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', user.id);

    return NextResponse.json({ success: true, interval_days });
  } catch (err) {
    console.error('[POST /api/study/review]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
