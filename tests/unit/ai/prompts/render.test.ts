/**
 * RED UNIT TESTS — TS2-03: Versioned Prompt Template System (renderPrompt)
 *
 * These tests MUST FAIL until implementation exists at:
 *   - lib/ai/prompts/index.ts (renderPrompt, getPrompt)
 *   - lib/ai/prompts/registry.ts
 *   - lib/ai/prompts/types.ts
 *   - lib/ai/prompts/frq/humanities_grader_v1.ts
 *   - lib/ai/prompts/frq/stem_grader_v1.ts
 *   - lib/ai/prompts/diagnostic/mcq_evaluator_v1.ts
 *   - lib/ai/prompts/diagnostic/score_predictor_v1.ts
 *   - lib/ai/prompts/explainer/wrong_answer_text_v1.ts
 *   - lib/ai/prompts/explainer/wrong_answer_stem_v1.ts
 *   - lib/ai/prompts/study_plan/generator_v1.ts
 *
 * Gherkin source: tests/gherkin/sprint-2/technical/TS2-03_prompt_template_system.feature
 */

import { describe, it, expect } from 'vitest';

// These imports WILL FAIL until implementation exists — RED state is correct
import { renderPrompt, getPrompt } from '@/lib/ai/prompts';
import { promptRegistry } from '@/lib/ai/prompts/registry';

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — renderPrompt correctly substitutes all template variables
// ─────────────────────────────────────────────────────────────
describe('renderPrompt', () => {
  describe('when all required variables are provided', () => {
    it('substitutes all {{variable}} tokens in the user template', () => {
      const variables = {
        subject: 'AP US History',
        frq_type: 'DBQ',
        prompt: 'Analyze the causes of the Civil War.',
        rubric: 'Thesis (1pt): Responds with a defensible thesis...',
        student_response: 'The Civil War was caused by sectional tensions...',
      };

      const result = renderPrompt('frq_humanities_grader', variables);

      // No unreplaced tokens should remain
      expect(result.user).not.toMatch(/\{\{\w+\}\}/);
      // Each variable value should appear in the rendered output
      expect(result.user).toContain('AP US History');
      expect(result.user).toContain('DBQ');
      expect(result.user).toContain('Analyze the causes of the Civil War.');
    });

    it('returns a non-empty system string', () => {
      const variables = {
        subject: 'AP US History',
        frq_type: 'LEQ',
        prompt: 'Evaluate the impact of westward expansion.',
        rubric: 'Thesis (1pt)...',
        student_response: 'Westward expansion...',
      };

      const result = renderPrompt('frq_humanities_grader', variables);

      expect(result.system).not.toBe('');
      expect(result.system.length).toBeGreaterThan(20);
    });

    // Gherkin: Scenario — Rendered prompts contain no unreplaced template tokens
    it('leaves no unreplaced {{tokens}} in either system or user output', () => {
      const allRegistryKeys = Object.keys(promptRegistry);

      for (const key of allRegistryKeys) {
        const template = getPrompt(key);
        const dummyVars = Object.fromEntries(
          template.requiredVariables.map((v) => [v, `dummy_value_for_${v}`])
        );
        const result = renderPrompt(key, dummyVars);

        expect(result.user, `Key "${key}" user template has unreplaced tokens`)
          .not.toMatch(/\{\{\w+\}\}/);
        expect(result.system, `Key "${key}" system template has unreplaced tokens`)
          .not.toMatch(/\{\{\w+\}\}/);
      }
    });
  });

  // Gherkin: Scenario — renderPrompt throws when a required variable is missing
  describe('when a required variable is missing', () => {
    it('throws an error naming the missing variable', () => {
      const incompleteVars = {
        subject: 'AP US History',
        frq_type: 'DBQ',
        prompt: 'Some prompt',
        // rubric is missing
        student_response: 'Some response',
      };

      expect(() => renderPrompt('frq_humanities_grader', incompleteVars)).toThrowError(/rubric/);
    });

    it('throws before any downstream call is made', () => {
      // No gateway/fetch mock needed — error must be thrown synchronously
      expect(() =>
        renderPrompt('frq_humanities_grader', {})
      ).toThrow();
    });

    it('error message names ALL missing variables, not just the first', () => {
      // When subject and rubric are both missing, both should appear in error
      const partial = {
        frq_type: 'DBQ',
        prompt: 'Some prompt',
        student_response: 'Some response',
      };

      let errorMessage = '';
      try {
        renderPrompt('frq_humanities_grader', partial);
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      expect(errorMessage).toMatch(/subject/);
      expect(errorMessage).toMatch(/rubric/);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — Registry resolves correct version for each prompt key
// ─────────────────────────────────────────────────────────────
describe('getPrompt', () => {
  it('throws immediately for an unknown prompt key', () => {
    expect(() => getPrompt('nonexistent_prompt_xyz')).toThrowError(/nonexistent_prompt_xyz/);
  });

  it('returns a template with all required fields for every registered key', () => {
    const requiredFields = ['key', 'version', 'route', 'system', 'userTemplate', 'requiredVariables', 'maxInputTokens'];

    for (const [registryKey, template] of Object.entries(promptRegistry)) {
      for (const field of requiredFields) {
        expect(
          template,
          `Prompt key "${registryKey}" is missing field "${field}"`
        ).toHaveProperty(field);
      }
    }
  });

  it('returns a template where version is a valid semver string', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;

    for (const [key, template] of Object.entries(promptRegistry)) {
      expect(
        template.version,
        `Prompt "${key}" has invalid semver: "${template.version}"`
      ).toMatch(semverRegex);
    }
  });

  it('returns a template where requiredVariables is a non-empty array', () => {
    for (const [key, template] of Object.entries(promptRegistry)) {
      expect(
        Array.isArray(template.requiredVariables),
        `Prompt "${key}" requiredVariables is not an array`
      ).toBe(true);
      expect(
        template.requiredVariables.length,
        `Prompt "${key}" has zero required variables — this is likely wrong`
      ).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Registry completeness — all 7 required keys must exist
// ─────────────────────────────────────────────────────────────
describe('promptRegistry completeness', () => {
  const REQUIRED_KEYS = [
    'frq_humanities_grader',
    'frq_stem_grader',
    'mcq_evaluator',
    'score_predictor',
    'wrong_answer_explainer_text',
    'wrong_answer_explainer_stem',
    'study_plan_generator',
  ];

  it('contains all 7 required prompt keys', () => {
    for (const key of REQUIRED_KEYS) {
      expect(
        promptRegistry,
        `promptRegistry is missing required key: "${key}"`
      ).toHaveProperty(key);
    }
  });
});
