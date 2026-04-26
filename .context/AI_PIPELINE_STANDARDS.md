# AI PIPELINE STANDARDS
## AceOS — AI Architecture & Quality Reference
### Version 1.0 | Principal Engineer Authority Document

---

## Core Principle: LLMs Are Unreliable by Default

Every design decision in this pipeline starts from the same premise: LLMs are confidently wrong some percentage of the time. The product's job is to build systems that are correct despite that, not systems that hope the LLM is right.

**Three rules that follow from this:**
1. **Never let an LLM verify its own output.** STEM answers are validated by code execution (Modal sandbox), not by asking the model if its answer is correct.
2. **Never trust unvalidated AI output.** Every AI response is parsed against a Zod schema before being used. Invalid responses throw `INVALID_RESPONSE` errors, not silent corruptions.
3. **Human review is upstream, not downstream.** SME review happens before content ships (rubric templates, model answers), not as a real-time queue on individual student responses.

---

## Provider-Interface-Driver (PID) Model

This is the architecture rule that makes every AI provider swappable:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Code                      │
│  callAI({ route: 'frq_grading', messages: [...] })      │
└────────────────────────┬────────────────────────────────┘
                         │ route key only
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  AI Gateway (interface)                  │
│  lib/ai/gateway.ts — reads model_map.json               │
│  Routes by key — never knows about specific providers   │
└───────────┬───────────────────────┬─────────────────────┘
            │                       │
     ┌──────▼──────┐       ┌────────▼───────┐
     │  OpenAI     │       │     Groq        │
     │  (driver)   │       │   (driver)      │
     └─────────────┘       └────────────────┘
            │
     ┌──────▼──────┐
     │  Modal.com  │
     │  (driver)   │
     └─────────────┘
```

**Rule:** Application code never imports OpenAI SDK, Groq SDK, or any AI provider SDK directly. All AI calls go through `callAI()` from `lib/ai/gateway.ts`. All model selection happens in `model_map.json`.

---

## model_map.json Rules

- Lives at repo root, committed to version control
- Every field is required: `provider`, `model`, `max_tokens`, `temperature`, `reasoning`
- `reasoning` field is mandatory — documents why this route uses this model
- Changing a model requires only editing this file — zero TypeScript changes
- A new AI provider requires: (1) add to `providers` block, (2) add env key to `.env.example`, (3) zero application code changes

```json
// Required shape for every route entry:
{
  "provider": "openai",           // must match a key in providers block
  "model": "gpt-4o",             // exact model ID from provider's API
  "max_tokens": 2000,            // always set, never omit
  "temperature": 0.2,            // always set, never omit
  "reasoning": "Why this model"  // required — mandatory documentation
}
```

---

## Prompt Template Rules

### The Prime Directive
**No prompt string ever exists outside `lib/ai/prompts/`.** This is an absolute rule enforced by ESLint. If a prompt is in an API route, a component, or a utility file, it is a bug.

### Versioning
- Every prompt file is named `{key}_v{major}.ts` (e.g., `humanities_grader_v1.ts`)
- Version increments when: system prompt changes, user template changes, required variables change
- Old versions are kept in the directory — never deleted — for rollback
- The registry points to the current active version — changing the registry is the rollback mechanism

### Prompt Change Process
1. Create `{key}_v{N+1}.ts` with changes
2. Write tests for new behavior in `__tests__/prompt_integrity.test.ts`
3. Update `registry.ts` to point to new version
4. Run QA harness with new version against 10 test fixtures before merging
5. Monitor `ai_quality_log` for schema validation errors for 24hrs after deploy

### Variable Injection Rules
- Student input ALWAYS goes in the `user` role message, NEVER in the `system` prompt
- System prompts contain ONLY static instructions — never interpolated values
- `renderPrompt()` validates all required variables before building messages — missing variable = throw at render time, not at AI call time

---

## STEM Validation Rules

### The Non-Negotiable
Mathematical and scientific answers in these subjects are ALWAYS validated by Modal sandbox:
- AP Calculus AB / BC
- AP Statistics  
- AP Chemistry
- AP Physics 1 / 2 / C
- AP Biology (numerical answers only)
- AP Computer Science A (code execution)

### Tolerance Standards by Subject
```typescript
export const ANSWER_TOLERANCES: Record<string, number> = {
  'AP Calculus AB': 0.001,   // High precision — calculus answers must be tight
  'AP Calculus BC': 0.001,
  'AP Statistics': 0.01,     // 1% — stat answers have rounding conventions
  'AP Chemistry': 0.01,      // 1% — sig fig aware
  'AP Physics 1': 0.02,      // 2% — physics has measurement tolerance
  'AP Physics 2': 0.02,
  'AP Biology': 0.05,        // 5% — bio numerical answers less precise
};
```

### Fallback Behavior When Modal Is Unavailable
```typescript
// The fallback contract — never block the student
const fallbackResponse: STEMValidationResponse = {
  correct: null,                         // null = unknown, NOT false
  student_value: body.student_answer,
  expected_value: null,
  tolerance_used: 0,
  error: 'VALIDATION_UNAVAILABLE',
  execution_time_ms: 0
};
// HTTP 200 always — validation failure is not an application error
```

---

## AI Response Schema Validation

Every AI response type has a Zod schema. New AI-calling feature = new Zod schema.

```
lib/ai/schemas/
├── frq_grading_response.ts       # FRQ humanities grading output
├── frq_stem_grading_response.ts  # FRQ STEM grading output
├── mcq_evaluation_response.ts    # MCQ answer evaluation
├── score_prediction_response.ts  # Predicted AP score output
├── study_plan_response.ts        # Study plan generation output
├── explainer_response.ts         # Wrong-answer explanation output
└── index.ts                      # Exports all parse functions
```

**Schema validation rules:**
- `safeParse` is used, not `parse` — never throw Zod errors uncaught
- Failed validation throws `AIError` with code `INVALID_RESPONSE`
- JSON extraction handles markdown code block wrapping (`\`\`\`json...\`\`\``) before parsing
- Minimum string lengths enforce meaningful responses (feedback must be > 10 chars)

---

## AI Cost Controls

### Token Budget Enforcement
```typescript
// lib/ai/prompts/index.ts — add to renderPrompt
import { encode } from 'gpt-tokenizer';

export function renderPrompt(key: string, variables: Record<string, string>) {
  // ... build messages
  
  const tokenCount = encode(user).length + encode(system).length;
  if (tokenCount > template.maxInputTokens) {
    throw new Error(
      `Prompt "${key}" input exceeds token budget: ${tokenCount} > ${template.maxInputTokens}`
    );
  }
  
  return { system, user };
}
```

### Cost Tracking
All AI usage is logged to `ai_usage_log`. Weekly cost report query:
```sql
SELECT 
  route,
  model,
  COUNT(*) as calls,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  -- Approximate cost (update rates as pricing changes)
  ROUND(SUM(prompt_tokens) * 0.000005 + SUM(completion_tokens) * 0.000015, 2) as est_cost_usd
FROM ai_usage_log
WHERE created_at > now() - interval '7 days'
GROUP BY route, model
ORDER BY est_cost_usd DESC;
```

---

## SME Review Integration Points

The AI pipeline has three human checkpoints (see `TESTING_STANDARDS.md` for full detail):

| Gate | When | Blocks What |
|---|---|---|
| Tier 1: Pre-launch content audit | Before subject launches | Subject going live |
| Tier 2: Weekly 2% random sample | Every week, permanently | Nothing — quality signal |
| Tier 3: Student-triggered review | On demand | Individual grade accuracy |

**Engineering responsibility for SME review:**
- `frq_submissions` table has a `review_status` column: `auto_graded | flagged | human_reviewed`
- Student dispute triggers a database update: `review_status = 'flagged'`, `flagged_at = now()`
- A daily cron job sends flagged submissions to the SME review queue
- When SME overrides: `ai_score` is preserved, `human_score` is set, `review_status = 'human_reviewed'`
- Training signal table: `sme_corrections` stores every case where AI was wrong for future retraining

---

## Prohibited AI Patterns

These patterns are banned. Any PR introducing them is rejected.

```typescript
// ❌ BANNED: Direct OpenAI SDK import in application code
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ CORRECT: Always through gateway
import { callAI } from '@/lib/ai/gateway';

// ❌ BANNED: Hardcoded model name
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  body: JSON.stringify({ model: 'gpt-4o', ... })  // hardcoded model
});

// ❌ BANNED: LLM validating its own STEM answer
const messages = [
  { role: 'user', content: `Is ${studentAnswer} the correct answer to this chemistry problem?` }
];
// Use Modal sandbox instead

// ❌ BANNED: Inline prompt strings in route files
export async function POST(req) {
  const prompt = `You are an expert AP grader...`;  // inline prompt = banned
}

// ❌ BANNED: Unvalidated AI response used directly
const aiResponse = await callAI(...);
const data = JSON.parse(aiResponse.content);  // no schema validation = banned
// Use parseGradingResponse() or equivalent Zod parser
```

---

*AceOS — AI Pipeline Standards v1.0 | April 2026*
