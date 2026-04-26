/**
 * Prompt Loader — only public export point for the prompts module
 * TS2-03 — Versioned Prompt Template System
 */

import { promptRegistry } from './registry';
import type { PromptTemplate } from './types';

export { promptRegistry } from './registry';
export type { PromptTemplate } from './types';

export function getPrompt(key: string): PromptTemplate {
  const template = promptRegistry[key];
  if (!template) {
    throw new Error(
      `Unknown prompt key: "${key}". Check lib/ai/prompts/registry.ts for valid keys.`
    );
  }
  return template;
}

export function renderPrompt(
  key: string,
  variables: Record<string, string>
): { system: string; user: string } {
  const template = getPrompt(key);

  const missing = template.requiredVariables.filter((v) => !(v in variables));
  if (missing.length > 0) {
    throw new Error(
      `Prompt "${key}" missing required variables: ${missing.join(', ')}`
    );
  }

  let user = template.userTemplate;
  for (const [varKey, value] of Object.entries(variables)) {
    user = user.replaceAll(`{{${varKey}}}`, value);
  }

  return {
    system: template.system,
    user,
  };
}
