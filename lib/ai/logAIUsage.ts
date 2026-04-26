/**
 * Fire-and-forget AI usage logger
 * TS2-02 — LiteLLM Gateway (usage logging)
 *
 * Inserts a row into ai_usage_log via Supabase service role client.
 * Must never throw — callers use .catch(console.error) and do not await.
 */

import { createClient } from '@supabase/supabase-js';

export interface AIUsageEntry {
  route: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  metadata?: Record<string, string>;
}

export async function logAIUsage(entry: AIUsageEntry): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Not configured — skip silently (dev environments may not have service key)
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  await supabase.from('ai_usage_log').insert({
    route: entry.route,
    model: entry.model,
    provider: entry.provider,
    prompt_tokens: entry.prompt_tokens,
    completion_tokens: entry.completion_tokens,
    latency_ms: entry.latency_ms,
    student_id: entry.metadata?.student_id ?? null,
    question_id: entry.metadata?.question_id ?? null,
    session_id: entry.metadata?.session_id ?? null,
  });
}
