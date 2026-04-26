# Sprint 2 — Functional Stories
## Epic 1: Foundation & Legal | Phase 1: ScoreBoost AP
**Sprint 2 | Weeks 3–4 | AceOS v1.0**

---

## Overview

Sprint 2 builds the AI infrastructure backbone: the Modal.com Python sandbox for STEM answer validation, the LiteLLM routing pipeline under real load, versioned prompt templates, graceful AI degradation, and the internal QA pipeline. This sprint is entirely non-user-facing — it is the engine that makes every AI-powered feature in Sprints 3–12 trustworthy.

**Definition of Done for Sprint 2:** The AI pipeline routes correctly, STEM answers are validated via Python code execution (not LLM self-audit), and the system degrades gracefully when any vendor is unavailable. 50 test questions run through the full pipeline with accuracy manually audited.

---

## F2.1 — STEM Answer Validation via Python Sandbox

**As a** student submitting a STEM answer,
**I need** my mathematical and scientific answers to be validated by a Python code interpreter rather than an LLM,
**So that** I receive objectively correct feedback on numerical answers, not a plausible-sounding but potentially wrong LLM opinion.

### Why This Matters
LLMs hallucinate on STEM calculations. A student who submits that the molar mass of H₂O is 18.015 g/mol should get a definitive correct/incorrect response — not an LLM's confident guess. The Modal.com Python sandbox runs actual Python code to verify answers.

### User Flow

1. Student submits a STEM answer (typed or photo upload)
2. System determines answer type: numerical, equation, multi-step
3. For numerical/equation answers: system sends the student's answer and the expected answer to the Python sandbox
4. Sandbox executes validation script and returns: `{ correct: boolean, student_value: any, expected_value: any, tolerance_met: boolean }`
5. UI shows: correct ✓ or incorrect ✗ with the specific numerical discrepancy if wrong
6. For multi-step problems: each step is validated independently

### Validation Flow for a Multi-Step Problem

```
Student submits: "The molar mass of H₂SO₄ is 98 g/mol"

Sandbox receives:
  student_answer: 98
  expected_answer: 98.08
  tolerance: 0.5  ← configurable per question

Sandbox returns:
  correct: true  ← within tolerance
  student_value: 98
  expected_value: 98.08
  tolerance_met: true
  percent_error: 0.082%
```

### Acceptance Criteria

```gherkin
Scenario: Correct numerical answer is validated as correct
  Given a student submits "18.015" for the molar mass of water
  And the expected answer is 18.015 g/mol with tolerance 0.01
  When the sandbox validation runs
  Then the result is correct: true
  And the student sees a green checkmark with "Correct"

Scenario: Incorrect numerical answer is validated as incorrect
  Given a student submits "20" for the molar mass of water
  And the expected answer is 18.015 g/mol
  When the sandbox validation runs
  Then the result is correct: false
  And the student sees "Your answer: 20 g/mol | Expected: 18.015 g/mol"

Scenario: Answer within tolerance is accepted
  Given a question allows ±1% tolerance
  And the expected answer is 9.81 m/s²
  When a student submits 9.8
  Then percent_error = 0.1% which is within tolerance
  And the result is correct: true

Scenario: Sandbox failure does not block the student
  Given the Modal.com sandbox returns a 500 error
  When a student submits a STEM answer
  Then the system falls back to LLM validation
  And the student is shown: "Answer checked with AI (sandbox temporarily unavailable)"
  And an alert is sent to the engineering team
  And the fallback usage is logged

Scenario: Multi-step problem validates each step independently
  Given a 3-step stoichiometry problem
  When a student submits all three steps
  Then each step is validated in sequence
  And if step 2 is wrong, step 3 validation still runs
  And feedback shows which specific steps were correct or incorrect

Scenario: Python sandbox executes in under 3 seconds
  Given a standard numerical validation request
  When the sandbox executes the validation script
  Then the response returns within 3 seconds at the 95th percentile
```

---

## F2.2 — AI Routing Pipeline Under Real Load

**As a** student using any AI-powered feature,
**I need** the AI gateway to correctly route my request to the right model based on the feature type,
**So that** I get fast responses for low-stakes features and accurate responses for high-stakes grading.

### Routing Logic (User-Visible Behavior)

| Feature | Expected Behavior | Why |
|---|---|---|
| Wrong-answer explanation | Response appears within 2 seconds | Uses Groq fast inference |
| FRQ grading | Response appears within 30 seconds | Uses GPT-4o for accuracy |
| Score prediction | Response appears within 5 seconds | Uses GPT-4o mini |
| Tutoring response | Response appears within 2 seconds | Uses Groq for real-time feel |
| STEM FRQ with photo | Response appears within 45 seconds | Vision model + OCR pipeline |

### User Flow — Timeout Handling

1. Student submits a request (e.g., FRQ for grading)
2. Loading state shows with an estimated wait time: "Grading your response... (~20 seconds)"
3. If response returns: show results
4. If model times out (30s for text grading): show "Grading is taking longer than expected. We'll notify you when it's ready." — save response for async delivery
5. If total failure: show "Grading failed. Your response has been saved. Try again or contact support."

### Acceptance Criteria

```gherkin
Scenario: Fast inference routes to Groq
  Given a student receives a wrong-answer explanation
  When the explanation loads
  Then it appears within 2 seconds from submission
  And the response was served by Groq Llama model

Scenario: FRQ grading routes to GPT-4o
  Given a student submits a text FRQ for grading
  When the grading request is processed
  Then the grading model used is gpt-4o
  And the result is returned within 30 seconds

Scenario: Loading state shows estimated time
  Given a student submits an FRQ
  When grading begins
  Then a loading indicator appears immediately
  And the text "Grading your response... (~20 seconds)" is visible
  And the student is not shown a blank or frozen screen

Scenario: Timeout triggers async delivery
  Given gpt-4o takes longer than 30 seconds to respond
  When the timeout threshold is reached
  Then the student sees "Grading is taking longer than expected"
  And the response is saved for async delivery when available
  And no error is shown that implies permanent failure

Scenario: Complete AI failure shows recoverable error
  Given all AI providers are unavailable
  When a student submits a grading request
  Then the message is: "Grading is temporarily unavailable. Your response has been saved. Try again in a few minutes."
  And the student's submitted response is not lost

Scenario: Vision pipeline handles photo submission
  Given a student uploads a photo of handwritten STEM work
  When the photo is submitted for grading
  Then the system acknowledges: "Processing your photo... (~30 seconds)"
  And the grading result returns within 45 seconds at the 95th percentile
```

---

## F2.3 — Prompt Template Version Management

**As a** product team member reviewing AI quality,
**I need** every AI prompt to be versioned and logged with each response,
**So that** we can audit why a specific grading decision was made and roll back prompt changes if quality degrades.

### User-Facing Behavior

This story has no direct user-facing UI. Its impact is felt indirectly:
- Students receive consistent grading quality because prompts cannot silently change
- If a prompt change degrades quality, the weekly SME audit detects it and the team can roll back
- Support tickets about "the AI graded me wrong" can be investigated by looking up the prompt version that was active

### Prompt Versioning Flow

1. A prompt template change is made in `lib/ai/prompts/`
2. The file is committed to git — the version is the git commit SHA or a manual semantic version tag
3. Every AI call logs: `prompt_version`, `route_key`, `model_used`, `student_id` (hashed), `latency_ms`, `input_tokens`, `output_tokens`
4. The Tier 2 SME audit dashboard shows the prompt version active during any sampled FRQ — auditors can see if quality changed after a prompt update

### Acceptance Criteria

```gherkin
Scenario: Every AI response logs its prompt version
  Given a student submits an FRQ for grading
  When the grading response is generated
  Then an ai_call_log record is created containing:
    - prompt_version (string, e.g., "frq_humanities_v1.2.0")
    - route_key (e.g., "grading_text")
    - model_used (e.g., "gpt-4o")
    - student_id_hash (hashed, not raw)
    - latency_ms
    - input_tokens
    - output_tokens
    - created_at

Scenario: Prompt rollback is achievable without code deploy
  Given prompt frq_humanities_v1.3.0 is producing lower quality output
  When the team changes the active prompt version to frq_humanities_v1.2.0 in config
  Then subsequent grading calls use frq_humanities_v1.2.0
  And no application code deployment is required

Scenario: ai_call_log is not readable by students
  Given an authenticated student
  When they query ai_call_log
  Then zero rows are returned (RLS blocks client access)

Scenario: Prompts are never hardcoded in API routes or components
  Given a code review of any API route or server action
  When the code is inspected
  Then no raw prompt strings exist outside lib/ai/prompts/
  And all prompt references are imported from the prompts module
```

---

## F2.4 — Internal QA Pipeline: 50-Question Accuracy Audit

**As a** product team member,
**I need** an internal QA process that runs 50 representative test questions through the full AI pipeline and reports accuracy,
**So that** we can verify the pipeline is working correctly before any student uses it.

### QA Scope

The 50 test questions cover:
- 10 AP US History multiple choice (text, LLM routing)
- 10 AP English Language multiple choice (text, LLM routing)
- 10 AP Chemistry multiple choice — numerical (STEM, sandbox routing)
- 10 AP Calculus AB multiple choice — equation-based (STEM, sandbox routing)
- 5 AP US History FRQ (text grading pipeline, rubric check)
- 5 AP Chemistry FRQ (STEM grading pipeline, step validation)

### What "Accuracy" Means for This Audit

| Question Type | Accuracy Definition |
|---|---|
| Multiple choice (text) | AI selects the correct answer OR provides a coherent explanation of the correct answer |
| Multiple choice (STEM numerical) | Sandbox validates the correct numerical answer; error rate = 0% |
| FRQ (text) | AI rubric score matches human reviewer score within ±1 point on ≥80% of essays |
| FRQ (STEM) | AI identifies the correct step breakdown; matches human step-scoring on ≥75% of responses |

### User Flow (Internal Team)

1. QA engineer runs `npm run qa:pipeline-audit` from the command line
2. Script sends all 50 test questions through the live pipeline
3. Script outputs a report: per-question result, accuracy summary, latency stats, cost estimate
4. Team reviews report and manually spot-checks 10 flagged responses
5. If accuracy thresholds are not met, the sprint does not advance to Sprint 3

### Acceptance Criteria

```gherkin
Scenario: QA script completes without errors
  Given the QA pipeline script is run
  When all 50 questions are processed
  Then the script exits with code 0
  And a report file is generated at /reports/qa_audit_{timestamp}.json

Scenario: Numerical STEM accuracy is 100%
  Given 10 STEM multiple choice questions with definitive numerical answers
  When the sandbox validates each answer
  Then all 10 return correct results
  And 0 questions are validated incorrectly by the sandbox

Scenario: Text FRQ rubric accuracy meets threshold
  Given 5 AP US History FRQs graded by the AI
  And the same 5 FRQs independently scored by a human reviewer
  When the scores are compared
  Then AI-to-human agreement is ≥80% (≥4 of 5 within ±1 point)

Scenario: Latency report shows acceptable performance
  Given the 50-question audit completes
  When the latency report is reviewed
  Then median response time for text routes < 5 seconds
  And median response time for STEM routes < 8 seconds
  And no individual response exceeded 45 seconds

Scenario: Cost estimate is within acceptable range
  Given the 50-question audit completes
  When the cost report is reviewed
  Then estimated cost per student per month (extrapolated from 50 questions) < $3.00

Scenario: Pipeline audit is a blocking gate for Sprint 3
  Given the QA audit report shows text FRQ accuracy below 80%
  Then Sprint 3 work does not begin
  And the team investigates and fixes the failing rubric templates first
```

---

## F2.5 — AI Failure Handling & Degradation Modes

**As a** student using any AI-powered feature,
**I need** the app to remain functional and informative when an AI service fails,
**So that** I am never left on a broken or blank screen and my data is never lost.

### Degradation Mode Catalog

| Failure Mode | User-Visible Behavior | Data Behavior |
|---|---|---|
| LLM primary down, fallback available | Feature works normally, slightly slower | No change |
| All LLMs down | "AI is temporarily unavailable. [Feature] will resume shortly." | Student's input is saved |
| Modal sandbox down | Falls back to LLM validation with a disclosure message | Logged for audit |
| Supabase down | "We're having trouble connecting. Your data is safe." | No write attempted |
| Timeout (request > threshold) | "This is taking longer than expected." + async delivery | Input saved |
| Partial response (stream cut off) | Retry button shown | Partial response discarded |

### Acceptance Criteria

```gherkin
Scenario: Student input is never lost during an AI failure
  Given a student types a 500-word FRQ response
  And the AI service fails during grading
  When the failure occurs
  Then the student's 500-word response is still visible in the text area
  And a "Try again" button is available
  And no data has been deleted or lost

Scenario: Retry button resubmits without re-entering data
  Given an AI failure occurred during FRQ grading
  And the student sees the failure message and their response
  When the student clicks "Try again"
  Then the exact same response is resubmitted without the student retyping it
  And a new loading state begins

Scenario: Each failure mode shows a distinct, honest message
  Given a network failure
  Then message: "You're offline. Check your connection."
  Given an AI timeout
  Then message: "Grading is taking longer than expected. We'll notify you when ready."
  Given a total AI outage
  Then message: "AI grading is temporarily unavailable. Your response has been saved."
  And none of these messages show a raw error code or stack trace

Scenario: Fallback model disclosure is shown when sandbox is down
  Given the Modal sandbox is unavailable
  And a student submits a numerical STEM answer
  When LLM fallback validation is used
  Then the result shows a small disclosure: "Checked with AI — verify with your teacher if unsure"
  And the result is still displayed (not blocked)
```

---

## F2.6 — Dashboard Shell (Post-Onboarding Landing State)

**As a** newly onboarded student who has completed subject selection,
**I need** a dashboard landing screen that acknowledges my setup and clearly tells me what to do next,
**So that** I am not dropped into a blank screen after onboarding.

### Dashboard State: Post-Onboarding, Pre-Diagnostic

This is the "empty state" of the dashboard — the student has set up their subjects but has not yet taken a diagnostic.

### User Flow

1. Student completes subject selection → redirected to `/dashboard`
2. Dashboard shows:
   - Welcome message: "Welcome, [First Name]. You're set up for [N] AP subject(s)."
   - Subject cards: one per selected subject, each with a "Take Diagnostic" CTA
   - Progress indicator: "Step 1 of 3: Take your diagnostic → Step 2: Daily practice → Step 3: Track your score"
   - Estimated time: "Your AP [Subject] diagnostic takes about 45 minutes."
3. Student clicks "Take Diagnostic" on any subject card → navigates to `/diagnostic/[subject_code]`

### Acceptance Criteria

```gherkin
Scenario: Dashboard shows correct subjects after onboarding
  Given a student selected AP Chemistry and AP US History during onboarding
  When they land on /dashboard
  Then two subject cards are displayed
  And one card shows "AP Chemistry" with a "Take Diagnostic" button
  And one card shows "AP US History" with a "Take Diagnostic" button

Scenario: Dashboard does not show features that require a diagnostic
  Given a student has not yet completed any diagnostic
  When they view /dashboard
  Then no practice questions are shown
  And no predicted score is shown
  And no study plan is shown
  And the only available action is "Take Diagnostic"

Scenario: Progress indicator shows current step
  Given a student who has completed onboarding but no diagnostic
  When they view the dashboard
  Then Step 1 (Take your diagnostic) is highlighted
  And Steps 2 and 3 are shown as upcoming (grayed out or numbered)

Scenario: Dashboard is accessible immediately after onboarding
  Given a student completes subject selection
  When they are redirected to /dashboard
  Then the page loads in under 2 seconds
  And no data fetching errors occur
  And all subject cards are visible without scrolling on a standard laptop viewport
```

---

*Sprint 2 Functional Stories | Epic 1: Foundation & Legal | AceOS v1.0*
*Stories authored for Test-Forward development: Gherkin scenarios drive automation suite → Technical stories drive implementation*
