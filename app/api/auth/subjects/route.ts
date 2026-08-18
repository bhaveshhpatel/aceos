import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
  );
}

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ subjects: [] });
  }

  const service = serviceClient();
  const { data: studentSubjs } = await service
    .from('student_subjects')
    .select('subject_id, subjects(id, name, slug, type)')
    .eq('student_id', user.id);

  if (!studentSubjs || studentSubjs.length === 0) {
    return NextResponse.json({ subjects: [] });
  }

  const subjects = studentSubjs.map((ss: any) => ({
    id: ss.subjects?.id || ss.subject_id,
    name: ss.subjects?.name || ss.subject_id,
    slug: ss.subjects?.slug || ss.subject_id,
    type: ss.subjects?.type || 'TEXT',
  }));

  return NextResponse.json({ subjects });
}
