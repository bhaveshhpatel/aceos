/**
 * Prompt Template Interface
 * TS2-03 — Versioned Prompt Template System
 */

import type { RouteKey } from '@/lib/ai/gateway';

export interface PromptTemplate {
  key: string;
  version: string;              // semver: "1.0.0"
  route: RouteKey;
  description: string;
  system: string;
  userTemplate: string;         // {{variable}} placeholders
  requiredVariables: string[];
  maxInputTokens: number;
  changelog: string;
}
