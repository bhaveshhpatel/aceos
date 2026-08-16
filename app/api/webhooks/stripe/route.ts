import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === 'checkout.session.completed') {
      const studentId = body.data?.object?.client_reference_id;
      if (studentId) {
        const service = serviceClient();
        await service
          .from('students')
          .update({ account_status: 'active' })
          .eq('id', studentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[POST /api/webhooks/stripe]', err);
    return NextResponse.json({ error: 'WEBHOOK_ERROR' }, { status: 400 });
  }
}
