# Sprint 2 — Technical Stories
## Epic 1: Foundation & Legal | Weeks 3–4
### AceOS Phase 1 | Lead Engineer Reference Document

---

## Sprint Overview

Sprint 2 completes the AI infrastructure layer. Sprint 1 delivered auth, database, onboarding, and legal groundwork. Sprint 2 delivers the Modal.com Python sandbox for STEM validation, the LiteLLM gateway with full routing logic, versioned prompt templates, error handling, and a full internal QA pass across the pipeline. Nothing in this sprint is user-visible beyond error states — this is the engine that every subsequent sprint sits on top of.

**Sprint 2 Definition of Done:**
The AI pipeline routes correctly across all three paths (text → GPT-4o, fast/low-stakes → Groq, STEM → Modal sandbox). STEM answers are validated via code execution, not LLM self-audit. The system degrades gracefully when any vendor is unavailable. 50 test questions have been run through the full pipeline and manually audited for accuracy.

---

## Blocking Dependencies from Sprint 1

Before any Sprint 2 story begins, confirm Sprint 1 exit criteria are met:

- [ ] Supabase project live with RLS enforced
- [ ] `model_map.json` stub exists in repo (even if unpopulated)
- [ ] Environment variable structure established (`LITELLM_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`)
- [ ] CI/CD pipeline passing on `main`
- [ ] Student onboarding flow deployed (Sprint 1 DoD met)

---

## Technical Stories

---

### TS2-01 — Modal.com Python Sandbox Deployment

**Story:**
As the AI pipeline, I need a secure, isolated Python execution environment so that STEM answers containing mathematical expressions, equations, and numerical computations can be validated by running actual code — not by asking an LLM to self-audit its own output.

**Why this matters:**
LLMs can be confidently wrong on numerical answers. A student who submits `x = 4.2` to an AP Chemistry stoichiometry question needs to know if `4.2` is numerically correct — not whether GPT-4o thinks it looks right. Modal.com provides ephemeral Python sandboxes that execute code in milliseconds. This is the correctness guarantee for every STEM answer in the product.

**Technical Specification:**

**Modal.com App Structure:**
```
modal_sandbox/
├── app.py                  # Modal app entrypoint
├── handlers/
│   ├── math_validator.py   # Numerical answer validation
│   ├── chem_validator.py   # Chemistry-specific (balancing, stoichiometry)
│   ├── physics_validator.py
│   └── code_runner.py      # AP CS A — Java/Python execution
├── schemas/
│   ├── validation_request.py
│   └── validation_response.py
└── tests/
    └── test_validators.py
```

**Modal App Definition (`app.py`):**
```python
import modal

app = modal.App("aceos-stem-validator")

image = modal.Image.debian_slim().pip_install(
    "sympy==1.13.0",
    "numpy==1.26.4",
    "scipy==1.13.0",
    "chempy==0.8.3",
    "pint==0.23",       # unit handling
    "pytest==8.2.0"
)

@app.function(
    image=image,
    timeout=30,             # 30s hard limit per execution
    memory=512,
    cpu=0.25,
    retries=modal.Retries(max_retries=2, backoff_coefficient=1.5)
)
def validate_stem_answer(request: dict) -> dict:
    """
    Routes to subject-specific validator based on request.subject_type.
    Returns: { correct: bool, student_value: any, expected_value: any,
               tolerance_used: float, error: str | None }
    """
    from handlers.math_validator import validate_math
    from handlers.chem_validator import validate_chemistry
    
    subject = request.get("subject_type")
    
    if subject in ["AP Calculus AB", "AP Calculus BC", "AP Statistics"]:
        return validate_math(request)
    elif subject in ["AP Chemistry"]:
        return validate_chemistry(request)
    elif subject in ["AP Physics 1", "AP Physics 2", "AP Physics C"]:
        return validate_physics(request)
    else:
        return validate_math(request)  # fallback
```

**Math Validator (`handlers/math_validator.py`):**
```python
from sympy import sympify, simplify, N
from sympy.parsing.latex import parse_latex

def validate_math(request: dict) -> dict:
    student_answer = request["student_answer"]   # string: "4.2" or LaTeX
    correct_answer = request["correct_answer"]   # string: expression or value
    tolerance = request.get("tolerance", 0.01)   # default ±1%
    answer_type = request.get("answer_type", "numerical")  # numerical | symbolic | expression
    
    try:
        if answer_type == "numerical":
            student_val = float(sympify(student_answer))
            correct_val = float(sympify(correct_answer))
            is_correct = abs(student_val - correct_val) / abs(correct_val) <= tolerance
            return {
                "correct": is_correct,
                "student_value": student_val,
                "expected_value": correct_val,
                "tolerance_used": tolerance,
                "error": None
            }
        elif answer_type == "symbolic":
            student_expr = sympify(student_answer)
            correct_expr = sympify(correct_answer)
            is_correct = simplify(student_expr - correct_expr) == 0
            return {
                "correct": bool(is_correct),
                "student_value": str(student_expr),
                "expected_value": str(correct_expr),
                "tolerance_used": 0,
                "error": None
            }
    except Exception as e:
        return {
            "correct": False,
            "student_value": student_answer,
            "expected_value": correct_answer,
            "tolerance_used": tolerance,
            "error": str(e)
        }
```

**Validation Request Schema:**
```typescript
// types/modal.ts
export interface STEMValidationRequest {
  question_id: string;
  subject_type: 'AP Calculus AB' | 'AP Chemistry' | 'AP Physics 1' | string;
  student_answer: string;        // raw string, LaTeX, or numeric string
  correct_answer: string;        // expected answer expression
  answer_type: 'numerical' | 'symbolic' | 'expression' | 'chemical_equation';
  tolerance?: number;            // default 0.01 (1%)
  units?: string;                // e.g. "mol/L" for chemistry
  significant_figures?: number;  // if sig figs matter for the rubric
}

export interface STEMValidationResponse {
  correct: boolean;
  student_value: string | number;
  expected_value: string | number;
  tolerance_used: number;
  error: string | null;
  execution_time_ms: number;
}
```

**Next.js API Route (`app/api/validate-stem/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STEMValidationRequest } from '@/types/modal';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: STEMValidationRequest = await req.json();
  
  // Input validation
  if (!body.student_answer || !body.correct_answer || !body.subject_type) {
    return NextResponse.json(
      { error: 'Missing required fields: student_answer, correct_answer, subject_type' },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  
  try {
    const modalResponse = await callModalSandbox(body);
    return NextResponse.json({
      ...modalResponse,
      execution_time_ms: Date.now() - startTime
    });
  } catch (error) {
    // Graceful degradation: if Modal is down, return unvalidated
    console.error('Modal sandbox unavailable:', error);
    return NextResponse.json({
      correct: null,           // null = could not validate, not wrong
      student_value: body.student_answer,
      expected_value: null,
      tolerance_used: 0,
      error: 'VALIDATION_UNAVAILABLE',
      execution_time_ms: Date.now() - startTime
    }, { status: 200 });       // 200 with null correct — client handles gracefully
  }
}

async function callModalSandbox(request: STEMValidationRequest) {
  const modalUrl = process.env.MODAL_SANDBOX_URL;
  const response = await fetch(`${modalUrl}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MODAL_API_KEY}`
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(15000)  // 15s timeout
  });
  
  if (!response.ok) {
    throw new Error(`Modal returned ${response.status}`);
  }
  
  return response.json();
}
```

**Environment Variables Required:**
```bash
MODAL_SANDBOX_URL=https://aceos-stem-validator--validate.modal.run
MODAL_API_KEY=...              # Modal webhook secret for auth
MODAL_TOKEN_ID=...             # For CLI deployment
MODAL_TOKEN_SECRET=...         # For CLI deployment
```

**Deployment Command:**
```bash
modal deploy modal_sandbox/app.py
```

**Acceptance Criteria:**

```gherkin
Feature: Modal.com STEM Validation Sandbox

  Scenario: Correct numerical answer passes validation
    Given a student submits "4.20" for an AP Chemistry question
    And the correct answer is "4.2" with tolerance 0.01
    When the API route POST /api/validate-stem is called
    Then Modal sandbox executes the validation
    And the response contains correct: true
    And execution_time_ms is under 5000

  Scenario: Incorrect numerical answer fails validation
    Given a student submits "3.8" for an AP Chemistry question
    And the correct answer is "4.2" with tolerance 0.01
    When the API route POST /api/validate-stem is called
    Then the response contains correct: false
    And student_value is 3.8 and expected_value is 4.2

  Scenario: Symbolic expression validation
    Given a student submits "x^2 + 2x + 1" for an AP Calculus question
    And the correct answer is "(x+1)^2"
    And answer_type is "symbolic"
    When validation is called
    Then the response contains correct: true
    Because sympy simplifies both expressions to the same form

  Scenario: Modal sandbox is unavailable
    Given the Modal sandbox URL is unreachable
    When a STEM validation is attempted
    Then the API returns HTTP 200
    And the response contains correct: null
    And error is "VALIDATION_UNAVAILABLE"
    And the client renders a "Could not verify answer" message
    And does NOT block the student from continuing

  Scenario: Unauthenticated request is rejected
    Given no valid session cookie is present
    When POST /api/validate-stem is called
    Then the response is HTTP 401
    And no Modal execution is triggered

  Scenario: Missing required fields return 400
    Given the request body is missing student_answer
    When POST /api/validate-stem is called
    Then the response is HTTP 400
    And the error message names the missing field
```

**Performance Requirement:** Modal cold start must complete under 3 seconds. Warm execution must complete under 1 second.

**Definition of Done:**
- Modal app deployed to production environment
- `/api/validate-stem` route live and authenticated
- All 6 Gherkin scenarios pass in automated test suite
- Graceful degradation tested and confirmed (Modal unreachable → `correct: null`, not 500)
- Environment variables documented in `.env.example`

---

### TS2-02 — LiteLLM Gateway with Full Routing Logic

**Story:**
As the AI layer, I need a centralized LiteLLM gateway with routing logic so that every AI call is dispatched to the correct model based on task type — and swapping any model requires only a config file change, not a code change.

**Why this matters:**
AI model costs and capabilities change fast. GPT-4o is expensive at scale. Groq is fast and cheap for low-stakes responses. No feature code should ever contain a hardcoded model name. The gateway is the single switch point.

**Technical Specification:**

**model_map.json (routing config — lives in repo root, never hardcoded in code):**
```json
{
  "routes": {
    "frq_grading": {
      "provider": "openai",
      "model": "gpt-4o",
      "max_tokens": 2000,
      "temperature": 0.2,
      "reasoning": "FRQ grading requires highest accuracy and rubric fidelity"
    },
    "frq_grading_stem": {
      "provider": "openai",
      "model": "gpt-4o",
      "max_tokens": 2000,
      "temperature": 0.1,
      "vision": true,
      "reasoning": "STEM grading requires vision + high accuracy for step evaluation"
    },
    "diagnostic_mcq": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "max_tokens": 500,
      "temperature": 0.3,
      "reasoning": "MCQ evaluation is lower stakes — mini is sufficient and cheaper"
    },
    "wrong_answer_explainer": {
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "max_tokens": 800,
      "temperature": 0.4,
      "reasoning": "Explanations need speed, not maximum accuracy — Groq latency wins here"
    },
    "study_plan_generation": {
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "max_tokens": 1200,
      "temperature": 0.3
    },
    "score_prediction": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "max_tokens": 300,
      "temperature": 0.1
    },
    "tutor_socratic": {
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "max_tokens": 600,
      "temperature": 0.5,
      "reasoning": "Tutor needs fast responses to maintain conversational flow"
    },
    "fallback": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "max_tokens": 500,
      "temperature": 0.3
    }
  },
  "providers": {
    "openai": {
      "env_key": "OPENAI_API_KEY",
      "base_url": "https://api.openai.com/v1"
    },
    "groq": {
      "env_key": "GROQ_API_KEY",
      "base_url": "https://api.groq.com/openai/v1"
    }
  }
}
```

**LiteLLM Gateway Service (`lib/ai/gateway.ts`):**
```typescript
import modelMap from '@/model_map.json';

export type RouteKey = keyof typeof modelMap.routes;

export interface AIRequest {
  route: RouteKey;
  messages: { role: 'system' | 'user' | 'assistant'; content: string | MessageContent[] }[];
  stream?: boolean;
  metadata?: Record<string, string>;  // for logging: student_id, question_id, etc.
}

export interface AIResponse {
  content: string;
  model_used: string;
  provider: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  const routeConfig = modelMap.routes[request.route] ?? modelMap.routes.fallback;
  const providerConfig = modelMap.providers[routeConfig.provider];
  const apiKey = process.env[providerConfig.env_key];
  
  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${routeConfig.provider}`);
  }

  const startTime = Date.now();
  
  const payload = {
    model: routeConfig.model,
    messages: request.messages,
    max_tokens: routeConfig.max_tokens,
    temperature: routeConfig.temperature,
    stream: request.stream ?? false
  };

  const response = await fetchWithRetry(
    `${providerConfig.base_url}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    },
    { retries: 2, backoffMs: 1000 }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new AIGatewayError(response.status, routeConfig.provider, error);
  }

  const data = await response.json();
  
  // Log usage to Supabase for cost tracking (non-blocking)
  logAIUsage({
    route: request.route,
    model: routeConfig.model,
    provider: routeConfig.provider,
    prompt_tokens: data.usage?.prompt_tokens ?? 0,
    completion_tokens: data.usage?.completion_tokens ?? 0,
    latency_ms: Date.now() - startTime,
    metadata: request.metadata
  }).catch(console.error);

  return {
    content: data.choices[0].message.content,
    model_used: routeConfig.model,
    provider: routeConfig.provider,
    usage: data.usage,
    latency_ms: Date.now() - startTime
  };
}

// Custom error class for structured error handling
export class AIGatewayError extends Error {
  constructor(
    public statusCode: number,
    public provider: string,
    public detail: unknown
  ) {
    super(`AI Gateway error from ${provider}: ${statusCode}`);
    this.name = 'AIGatewayError';
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: { retries: number; backoffMs: number }
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Only retry on 429 (rate limit) and 5xx
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retryConfig.retries) {
          await sleep(retryConfig.backoffMs * Math.pow(2, attempt));
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retryConfig.retries) {
        await sleep(retryConfig.backoffMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError!;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**AI Usage Logging Table (Supabase migration):**
```sql
-- migrations/20260103_create_ai_usage_log.sql
CREATE TABLE ai_usage_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  route         TEXT NOT NULL,
  model         TEXT NOT NULL,
  provider      TEXT NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  latency_ms    INT NOT NULL,
  student_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question_id   UUID,
  session_id    UUID
);

-- RLS: only service role can insert; no student can read others'
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON ai_usage_log
  USING (auth.role() = 'service_role');

-- Index for cost analysis queries
CREATE INDEX idx_ai_usage_created ON ai_usage_log (created_at DESC);
CREATE INDEX idx_ai_usage_route ON ai_usage_log (route, created_at DESC);
CREATE INDEX idx_ai_usage_student ON ai_usage_log (student_id, created_at DESC);
```

**Acceptance Criteria:**

```gherkin
Feature: LiteLLM AI Gateway Routing

  Scenario: FRQ grading routes to GPT-4o
    Given route is "frq_grading"
    When callAI is invoked with a grading request
    Then the outbound HTTP request targets api.openai.com
    And the model field in the payload is "gpt-4o"
    And temperature is 0.2

  Scenario: Wrong-answer explainer routes to Groq
    Given route is "wrong_answer_explainer"
    When callAI is invoked
    Then the outbound HTTP request targets api.groq.com
    And the model field is "llama-3.3-70b-versatile"

  Scenario: Unknown route falls back to gpt-4o-mini
    Given route is an undefined key not in model_map.json
    When callAI is invoked
    Then the fallback route is used
    And the model is "gpt-4o-mini"
    And no exception is thrown

  Scenario: Rate limit triggers retry with backoff
    Given the AI provider returns HTTP 429 on the first attempt
    When callAI is invoked
    Then the gateway retries after 1000ms
    And retries up to 2 times total
    And if all retries fail, throws AIGatewayError with status 429

  Scenario: Provider timeout triggers graceful error
    Given the provider does not respond within 30 seconds
    When callAI is invoked
    Then an AIGatewayError is thrown
    And the error is caught by the calling route handler
    And the API returns a structured error response to the client

  Scenario: AI usage is logged after every successful call
    Given callAI completes successfully for route "frq_grading"
    When the response is returned
    Then a row is inserted into ai_usage_log
    And route, model, provider, prompt_tokens, completion_tokens, latency_ms are populated
    And the logging failure does NOT throw or crash the main response

  Scenario: Swapping a model requires only model_map.json change
    Given the frq_grading route currently uses "gpt-4o"
    When the model field in model_map.json is changed to "gpt-4o-mini"
    And no TypeScript files are modified
    Then the next frq_grading call routes to "gpt-4o-mini"
```

**Definition of Done:**
- `lib/ai/gateway.ts` implemented and exported
- `model_map.json` committed to repo with all 8 initial routes populated
- `ai_usage_log` table migrated in Supabase with RLS enforced
- All 7 Gherkin scenarios covered in automated tests
- Retry logic verified with mock server that returns 429 on first attempt
- Timeout verified with mock that hangs for >30s

---

### TS2-03 — Versioned Prompt Template System

**Story:**
As the engineering team, I need a versioned prompt template system so that AI prompt changes are tracked in version control, can be rolled back, and are never scattered as inline strings across application code.

**Why this matters:**
Prompts are logic, not strings. A prompt change to the FRQ grader is as impactful as a code change to the grading algorithm. Inline prompts become invisible, unmaintainable, and impossible to audit. This system makes prompt changes deliberate, reviewable, and testable.

**Technical Specification:**

**Directory Structure:**
```
lib/ai/prompts/
├── index.ts                    # prompt loader — only export point
├── registry.ts                 # maps prompt_key → current version
├── frq/
│   ├── humanities_grader_v1.ts
│   ├── stem_grader_v1.ts
│   └── stem_grader_v2.ts       # future version — loaded when registry points here
├── diagnostic/
│   ├── mcq_evaluator_v1.ts
│   └── score_predictor_v1.ts
├── explainer/
│   ├── wrong_answer_text_v1.ts
│   └── wrong_answer_stem_v1.ts
├── study_plan/
│   └── generator_v1.ts
└── __tests__/
    └── prompt_integrity.test.ts
```

**Prompt Template Interface:**
```typescript
// lib/ai/prompts/types.ts
export interface PromptTemplate {
  key: string;                   // unique identifier, e.g. "frq_humanities_grader"
  version: string;               // semver: "1.0.0"
  route: RouteKey;               // maps to model_map.json route
  description: string;           // human-readable summary of what this prompt does
  system: string;                // system prompt
  userTemplate: string;          // Handlebars-style template with {{variable}} placeholders
  requiredVariables: string[];   // validated at render time
  maxInputTokens: number;        // enforced before calling gateway
  changelog: string;             // what changed from previous version
}
```

**Example Prompt — Humanities FRQ Grader:**
```typescript
// lib/ai/prompts/frq/humanities_grader_v1.ts
import { PromptTemplate } from '../types';

export const humanitiesFrqGraderV1: PromptTemplate = {
  key: 'frq_humanities_grader',
  version: '1.0.0',
  route: 'frq_grading',
  description: 'Grades AP humanities FRQ responses against College Board rubric structure',
  system: `You are an expert AP exam grader with experience reading AP US History, 
AP English Language, AP World History, and AP Psychology essays. 
You grade student responses using College Board rubric criteria only.
You are precise, consistent, and never award points for vague or unsupported claims.
You provide specific, actionable feedback that a student can act on before their next attempt.`,
  userTemplate: `Subject: {{subject}}
FRQ Type: {{frq_type}}
Prompt: {{prompt}}

Rubric:
{{rubric}}

Student Response:
{{student_response}}

Grade this response. For each rubric point:
1. State whether it is EARNED, PARTIALLY EARNED, or NOT EARNED
2. Quote the specific part of the student response that earned or failed to earn the point
3. Provide one sentence of actionable feedback

Return as JSON matching this schema:
{
  "total_score": number,
  "max_score": number,
  "rubric_points": [
    {
      "point_id": string,
      "point_description": string,
      "status": "EARNED" | "PARTIALLY_EARNED" | "NOT_EARNED",
      "evidence_quote": string | null,
      "feedback": string
    }
  ],
  "overall_feedback": string
}`,
  requiredVariables: ['subject', 'frq_type', 'prompt', 'rubric', 'student_response'],
  maxInputTokens: 6000,
  changelog: 'Initial version — baseline rubric-aligned grader'
};
```

**Prompt Registry:**
```typescript
// lib/ai/prompts/registry.ts
import { humanitiesFrqGraderV1 } from './frq/humanities_grader_v1';
import { stemGraderV1 } from './frq/stem_grader_v1';
import { mcqEvaluatorV1 } from './diagnostic/mcq_evaluator_v1';
import { scorePredictorV1 } from './diagnostic/score_predictor_v1';
import { wrongAnswerTextV1 } from './explainer/wrong_answer_text_v1';
import { wrongAnswerStemV1 } from './explainer/wrong_answer_stem_v1';
import { studyPlanGeneratorV1 } from './study_plan/generator_v1';

export const promptRegistry: Record<string, PromptTemplate> = {
  frq_humanities_grader: humanitiesFrqGraderV1,
  frq_stem_grader: stemGraderV1,
  mcq_evaluator: mcqEvaluatorV1,
  score_predictor: scorePredictorV1,
  wrong_answer_explainer_text: wrongAnswerTextV1,
  wrong_answer_explainer_stem: wrongAnswerStemV1,
  study_plan_generator: studyPlanGeneratorV1,
};
```

**Prompt Loader (`lib/ai/prompts/index.ts`):**
```typescript
import { promptRegistry } from './registry';
import { PromptTemplate } from './types';

export function getPrompt(key: string): PromptTemplate {
  const template = promptRegistry[key];
  if (!template) {
    throw new Error(`Unknown prompt key: "${key}". Check lib/ai/prompts/registry.ts`);
  }
  return template;
}

export function renderPrompt(key: string, variables: Record<string, string>): {
  system: string;
  user: string;
} {
  const template = getPrompt(key);
  
  // Validate all required variables are present
  const missing = template.requiredVariables.filter(v => !(v in variables));
  if (missing.length > 0) {
    throw new Error(`Prompt "${key}" missing required variables: ${missing.join(', ')}`);
  }

  // Render template — replace {{variable}} with values
  let user = template.userTemplate;
  for (const [key, value] of Object.entries(variables)) {
    user = user.replaceAll(`{{${key}}}`, value);
  }

  return {
    system: template.system,
    user
  };
}
```

**Usage Pattern (in any API route):**
```typescript
import { renderPrompt } from '@/lib/ai/prompts';
import { callAI } from '@/lib/ai/gateway';

const { system, user } = renderPrompt('frq_humanities_grader', {
  subject: 'AP US History',
  frq_type: 'DBQ',
  prompt: 'Evaluate the causes of the Civil War...',
  rubric: rubricText,
  student_response: studentEssay
});

const result = await callAI({
  route: 'frq_grading',
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ],
  metadata: { student_id: userId, question_id: questionId }
});
```

**Acceptance Criteria:**

```gherkin
Feature: Versioned Prompt Template System

  Scenario: Known prompt key renders correctly
    Given prompt key is "frq_humanities_grader"
    And variables include subject, frq_type, prompt, rubric, student_response
    When renderPrompt is called
    Then the returned user string contains no unreplaced {{variable}} tokens
    And the system string is non-empty

  Scenario: Missing required variable throws at render time
    Given prompt key is "frq_humanities_grader"
    And the variable "rubric" is omitted from the input
    When renderPrompt is called
    Then an Error is thrown
    And the error message names "rubric" as the missing variable
    And no AI gateway call is made

  Scenario: Unknown prompt key throws immediately
    Given prompt key is "nonexistent_prompt_xyz"
    When getPrompt is called
    Then an Error is thrown naming the unknown key

  Scenario: All registry keys resolve without error
    Given the prompt registry is loaded
    When getPrompt is called for every key in the registry
    Then no key throws an error
    And every template has non-empty system, userTemplate, and requiredVariables

  Scenario: Prompt version is tracked in template metadata
    Given any prompt template
    When its version field is read
    Then it is a valid semver string (e.g. "1.0.0")

  Scenario: Upgrading a prompt version requires only registry update
    Given stem_grader_v2.ts is added to the frq/ directory
    And registry.ts is updated to point frq_stem_grader to stemGraderV2
    When callAI is next invoked with frq_stem_grader
    Then the v2 system and userTemplate are used
    And no other files are modified
```

**Definition of Done:**
- All 7 prompt template files created with v1 content
- Registry maps all 7 keys
- `renderPrompt` validates variables and substitutes all tokens
- All 6 Gherkin scenarios automated in `lib/ai/prompts/__tests__/prompt_integrity.test.ts`
- No prompt string exists anywhere in `app/` or `lib/` outside of `lib/ai/prompts/`
- ESLint rule added to warn on hardcoded multi-line template literals in AI route files

---

### TS2-04 — AI Error Handling, Fallback States, and User-Visible Error UX

**Story:**
As the system, I need structured error handling across all AI call paths so that when any AI provider is unavailable, rate-limited, or returns an invalid response, the application degrades gracefully with a meaningful user-visible state — never a blank screen, never a crash, never silent data corruption.

**Technical Specification:**

**Error Type Taxonomy:**
```typescript
// lib/ai/errors.ts
export type AIErrorCode =
  | 'PROVIDER_UNAVAILABLE'       // 5xx or network failure after retries
  | 'RATE_LIMITED'               // 429, retries exhausted
  | 'TIMEOUT'                    // request exceeded 30s
  | 'INVALID_RESPONSE'           // response did not match expected schema
  | 'CONTENT_FILTERED'           // provider filtered the response (content policy)
  | 'QUOTA_EXCEEDED'             // monthly quota hit
  | 'VALIDATION_UNAVAILABLE';    // Modal sandbox specifically unavailable

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    public provider: string,
    public route: string,
    public retryable: boolean,
    message: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// User-facing messages — never expose raw errors to students
export const USER_FACING_ERRORS: Record<AIErrorCode, string> = {
  PROVIDER_UNAVAILABLE: 'Our AI is temporarily unavailable. Your answer has been saved — please try again in a few minutes.',
  RATE_LIMITED: 'We are receiving high demand right now. Your answer has been saved — please try again in 60 seconds.',
  TIMEOUT: 'This is taking longer than expected. Your answer has been saved — please try again.',
  INVALID_RESPONSE: 'Something went wrong with grading. Your response has been saved. Our team has been notified.',
  CONTENT_FILTERED: 'We could not process this response. Please review your answer and try again.',
  QUOTA_EXCEEDED: 'Our AI service is temporarily at capacity. Please try again later.',
  VALIDATION_UNAVAILABLE: 'We could not verify your answer right now. Your response has been saved.'
};
```

**API Route Error Boundary Pattern:**
```typescript
// lib/ai/handleAIError.ts
import { AIError, USER_FACING_ERRORS, AIErrorCode } from './errors';
import { NextResponse } from 'next/server';

export function handleAIError(error: unknown, context: {
  student_id?: string;
  route?: string;
  question_id?: string;
}): NextResponse {
  // Log full error internally (never expose to client)
  console.error('[AI Error]', {
    error,
    context,
    timestamp: new Date().toISOString()
  });
  
  if (error instanceof AIError) {
    const userMessage = USER_FACING_ERRORS[error.code];
    return NextResponse.json(
      {
        error: error.code,
        message: userMessage,
        retryable: error.retryable
      },
      { status: error.code === 'RATE_LIMITED' ? 429 : 503 }
    );
  }
  
  // Unknown error — generic fallback
  return NextResponse.json(
    {
      error: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
      retryable: true
    },
    { status: 500 }
  );
}
```

**Client-Side Error State Component:**
```typescript
// components/ai/AIErrorState.tsx
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AIErrorStateProps {
  errorCode: string;
  message: string;
  retryable: boolean;
  onRetry?: () => void;
  savedConfirmed?: boolean;  // shows "your answer was saved" reassurance
}

export function AIErrorState({ errorCode, message, retryable, onRetry, savedConfirmed }: AIErrorStateProps) {
  return (
    <div role="alert" aria-live="assertive" className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">{message}</p>
          {savedConfirmed && (
            <p className="text-xs text-yellow-600 mt-1">✓ Your answer has been saved</p>
          )}
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-yellow-700 hover:text-yellow-900"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Response Schema Validation (Zod):**
```typescript
// lib/ai/schemas/frq_grading_response.ts
import { z } from 'zod';

export const rubricPointSchema = z.object({
  point_id: z.string(),
  point_description: z.string(),
  status: z.enum(['EARNED', 'PARTIALLY_EARNED', 'NOT_EARNED']),
  evidence_quote: z.string().nullable(),
  feedback: z.string().min(10)
});

export const frqGradingResponseSchema = z.object({
  total_score: z.number().min(0),
  max_score: z.number().min(1),
  rubric_points: z.array(rubricPointSchema).min(1),
  overall_feedback: z.string().min(20)
});

export function parseGradingResponse(raw: string): z.infer<typeof frqGradingResponseSchema> {
  let parsed: unknown;
  try {
    // Handle markdown code blocks that some models wrap JSON in
    const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AIError('INVALID_RESPONSE', 'parser', 'frq_grading', false, 'Response was not valid JSON');
  }
  
  const result = frqGradingResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIError('INVALID_RESPONSE', 'parser', 'frq_grading', false,
      `Response schema validation failed: ${result.error.message}`);
  }
  
  return result.data;
}
```

**Acceptance Criteria:**

```gherkin
Feature: AI Error Handling and Graceful Degradation

  Scenario: Provider unavailable returns structured user-friendly error
    Given the AI provider returns a 503 status
    When a grading API route catches the error
    Then the API returns HTTP 503
    And the response body contains error: "PROVIDER_UNAVAILABLE"
    And the message is the user-friendly string (not a raw exception)
    And retryable is true

  Scenario: Rate limit returns 429 with retry guidance
    Given the AI provider returns 429 after all retries are exhausted
    When the error is handled
    Then the API returns HTTP 429
    And the response contains retryable: true
    And the student sees a message about high demand with a retry button

  Scenario: Invalid JSON response triggers INVALID_RESPONSE error
    Given the AI returns a response that is not parseable as JSON
    When parseGradingResponse is called
    Then an AIError with code INVALID_RESPONSE is thrown
    And the error is caught and the student sees an appropriate message
    And no partial or corrupt grading data is stored

  Scenario: Schema validation failure triggers INVALID_RESPONSE error
    Given the AI returns valid JSON but missing the rubric_points field
    When parseGradingResponse is called
    Then Zod validation fails
    And an AIError with code INVALID_RESPONSE is thrown

  Scenario: Raw error details are never exposed to the client
    Given any AI error occurs containing internal details (API key names, stack traces)
    When the error response reaches the client
    Then the response body contains only the structured error code and user-facing message
    And no internal details are present in the response

  Scenario: AIErrorState component renders with retry button when retryable
    Given an AI error response with retryable: true
    When AIErrorState is rendered
    Then a "Try again" button is visible
    And the component has role="alert" for screen reader accessibility
    And aria-live="assertive" is set

  Scenario: AIErrorState renders without retry button when not retryable
    Given an AI error response with retryable: false
    When AIErrorState is rendered
    Then no retry button is visible
    And the error message is still displayed
```

**Definition of Done:**
- `AIError` class and `USER_FACING_ERRORS` map implemented
- `handleAIError` utility used in every AI-calling API route (verified by code review)
- Zod schemas created for FRQ grading response and diagnostic MCQ response
- `AIErrorState` component renders correctly for all error states
- All 7 Gherkin scenarios automated
- No raw `Error` or unstructured `catch` blocks exist in any AI route

---

### TS2-05 — Internal QA Pipeline: 50-Question Full-Pipeline Audit

**Story:**
As the engineering and product team, I need a documented QA process and tooling to run 50 test questions through the complete AI pipeline — routing, prompt rendering, model response, schema validation, and STEM sandbox — and manually audit the results before any diagnostic content ships to students.

**Technical Specification:**

**QA Test Harness (`scripts/qa/pipeline_audit.ts`):**
```typescript
import { callAI } from '@/lib/ai/gateway';
import { renderPrompt } from '@/lib/ai/prompts';
import { parseGradingResponse } from '@/lib/ai/schemas/frq_grading_response';
import testFixtures from './fixtures/sprint2_qa_questions.json';

interface QAResult {
  question_id: string;
  subject: string;
  question_type: 'mcq' | 'frq' | 'stem_mcq';
  pipeline_route: string;
  model_used: string;
  latency_ms: number;
  response_valid: boolean;
  validation_error?: string;
  stem_sandbox_used: boolean;
  stem_sandbox_result?: boolean | null;  // null = unavailable
  raw_response: string;
  parsed_response?: unknown;
}

export async function runPipelineAudit(): Promise<QAResult[]> {
  const results: QAResult[] = [];
  
  for (const fixture of testFixtures) {
    const startTime = Date.now();
    const result: QAResult = {
      question_id: fixture.id,
      subject: fixture.subject,
      question_type: fixture.type,
      pipeline_route: fixture.route,
      model_used: '',
      latency_ms: 0,
      response_valid: false,
      stem_sandbox_used: false,
      raw_response: ''
    };
    
    try {
      const { system, user } = renderPrompt(fixture.prompt_key, fixture.variables);
      
      const aiResponse = await callAI({
        route: fixture.route,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        metadata: { question_id: fixture.id }
      });
      
      result.model_used = aiResponse.model_used;
      result.latency_ms = Date.now() - startTime;
      result.raw_response = aiResponse.content;
      
      // Validate response schema
      if (fixture.type === 'frq') {
        const parsed = parseGradingResponse(aiResponse.content);
        result.parsed_response = parsed;
        result.response_valid = true;
      } else {
        result.response_valid = true;  // MCQ — structural check
      }
      
      // STEM sandbox if applicable
      if (fixture.stem_answer) {
        result.stem_sandbox_used = true;
        const stemResult = await fetch('/api/validate-stem', {
          method: 'POST',
          body: JSON.stringify(fixture.stem_answer)
        });
        const stemData = await stemResult.json();
        result.stem_sandbox_result = stemData.correct;
      }
      
    } catch (error) {
      result.validation_error = (error as Error).message;
      result.response_valid = false;
    }
    
    results.push(result);
    console.log(`[${results.length}/${testFixtures.length}] ${fixture.id} — ${result.response_valid ? '✓' : '✗'} ${result.latency_ms}ms`);
  }
  
  return results;
}

// Output summary to console + write full results to JSON
```

**QA Checklist (manual review per question):**
```markdown
## Sprint 2 — 50-Question Pipeline QA Checklist

For each question in the audit batch, the reviewer records:

| Field | Pass Criteria |
|---|---|
| Route correct | Question type matches expected model_map route |
| Model correct | Response shows expected model (GPT-4o, GPT-4o-mini, or Groq) |
| Response valid JSON | No schema validation errors |
| Rubric points plausible | For FRQ: at least 1 rubric point evaluated per expected point |
| STEM answer correct | Modal sandbox result matches hand-calculated answer |
| Latency acceptable | Under 8 seconds for 95% of questions |
| No hallucinated rubric points | AI did not invent rubric criteria not present in the input |
| Feedback actionable | Each feedback sentence is specific and actionable |

Overall pass threshold: ≥ 45 of 50 questions must pass all 8 criteria.
If < 45 pass: document failure patterns and do not proceed to Epic 2.
```

**QA Fixture Format (`scripts/qa/fixtures/sprint2_qa_questions.json`):**
```json
[
  {
    "id": "qa_001",
    "subject": "AP US History",
    "type": "frq",
    "route": "frq_grading",
    "prompt_key": "frq_humanities_grader",
    "variables": {
      "subject": "AP US History",
      "frq_type": "LEQ",
      "prompt": "Evaluate the extent to which industrialization changed American society between 1865 and 1900.",
      "rubric": "Thesis/Claim (1 pt): Responds to the prompt with a historically defensible thesis that establishes a line of reasoning...",
      "student_response": "Industrialization dramatically transformed American society through urbanization, labor conflict, and economic inequality..."
    }
  },
  {
    "id": "qa_010",
    "subject": "AP Calculus AB",
    "type": "stem_mcq",
    "route": "diagnostic_mcq",
    "prompt_key": "mcq_evaluator",
    "variables": {},
    "stem_answer": {
      "subject_type": "AP Calculus AB",
      "student_answer": "12",
      "correct_answer": "12",
      "answer_type": "numerical",
      "tolerance": 0.01
    }
  }
]
```

**Acceptance Criteria:**

```gherkin
Feature: Sprint 2 Internal QA Pipeline

  Scenario: QA harness runs all 50 questions without crashing
    Given sprint2_qa_questions.json contains 50 valid fixtures
    When runPipelineAudit is executed
    Then all 50 questions complete (with pass or fail status per question)
    And the process does not exit with an unhandled exception
    And a results JSON file is written to scripts/qa/results/

  Scenario: 90% of questions pass all QA criteria
    Given the audit completes
    When results are reviewed
    Then at least 45 of 50 questions pass all 8 QA criteria
    And any failing questions have documented failure patterns

  Scenario: All STEM questions use Modal sandbox, not LLM
    Given the QA results for STEM subjects (AP Calc, AP Chem, AP Physics)
    When stem_sandbox_used is checked for each STEM question
    Then stem_sandbox_used is true for 100% of STEM answer validation entries
    And no STEM answer is marked correct based solely on LLM text response

  Scenario: P95 latency is under 8 seconds
    Given all 50 QA results with latency_ms recorded
    When the 95th percentile latency is calculated
    Then it is under 8000ms

  Scenario: QA failures block Epic 2 progression
    Given fewer than 45 questions pass all QA criteria
    When the sprint retrospective is held
    Then Epic 2 (Diagnostic Engine) does not begin until failure patterns are resolved
    And the specific failure patterns are documented as tech debt items
```

**Definition of Done:**
- QA harness script exists and runs end-to-end
- 50 fixture questions written across all 6 launch subjects and question types
- Audit completed, results JSON written to repo (`scripts/qa/results/sprint2_audit_results.json`)
- Manual review checklist completed and signed off by PM + Lead Engineer
- ≥ 45/50 pass threshold met
- Failure patterns (if any) documented as Sprint 3 prep items

---

## Sprint 2 — Exit Criteria Checklist

Before this sprint is marked complete and Epic 2 begins:

### Infrastructure
- [ ] Modal.com sandbox deployed and accessible at `MODAL_SANDBOX_URL`
- [ ] LiteLLM gateway routing verified for all 8 routes in `model_map.json`
- [ ] Prompt template system live with all 7 v1 templates committed
- [ ] `ai_usage_log` table migrated in Supabase
- [ ] All environment variables documented in `.env.example`

### Quality
- [ ] All automated Gherkin scenarios passing (TS2-01 through TS2-04)
- [ ] 50-question QA audit completed with ≥ 45/50 pass rate
- [ ] P95 latency < 8 seconds confirmed
- [ ] No raw vendor errors exposed to any API response
- [ ] Error states render correctly in UI (no blank screens, no console errors)

### Architecture Rules
- [ ] Zero hardcoded model names exist outside `model_map.json`
- [ ] Zero inline prompt strings exist outside `lib/ai/prompts/`
- [ ] Every AI route uses `handleAIError` in its catch block
- [ ] Every STEM answer validation uses Modal sandbox, not LLM text output

### Documentation
- [ ] `model_map.json` is self-documented with `reasoning` fields
- [ ] `.env.example` includes all Sprint 2 environment variables
- [ ] QA audit results committed to `scripts/qa/results/`
- [ ] Sprint 2 retro notes written (what was hard, what changed from plan)

---

*AceOS — Sprint 2 Technical Stories | Epic 1: Foundation & Legal | Phase 1 | April 2026*
*Engineering Reference Document — Not for External Distribution*
