import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const passwordUpdateSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = passwordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid password format' },
        { status: 400 }
      );
    }

    const { password } = parsed.data;

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[POST /api/auth/profile/update]', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
