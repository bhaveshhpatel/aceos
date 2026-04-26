# AceOS — Product Roadmap v1.0
### Combined, Ground-Up Rebuild from v14.0 + v4.1
**Timeline:** 24 Months | **Audience:** High School Students (Gr. 9–12) + Parents  
**Philosophy:** Build what a real student will open at 10pm under exam pressure — not what an educator wishes they would do.  
**Last Updated:** April 2026 | **Status:** Internal Working Document

---

## ⚠️ Founding Constraints (Read Before Anything Else)

These are non-negotiable realities that override any feature ambition in this document.

1. **FERPA compliance is not a Phase 4 task.** It is a Day 1 legal requirement. Any product touching student grades, academic records, or behavioral data requires FERPA compliance before a single student is onboarded. This shapes the data architecture from Sprint 1.

2. **LMS scraping via token harvesting is a legal and ToS liability.** Canvas and Schoology explicitly prohibit unauthorized credential-based API access. The browser extension must operate only on rendered DOM data visible to the logged-in user — not via token extraction. Obtain a legal opinion before Sprint 9.

3. **Students will not change their behavior for your product.** The product must fit into what students already do: check grades obsessively, cram the night before, ask "what do I need on the final," and share results with friends. Any feature requiring sustained new habits (daily voice recordings, Feynman teach-backs, group Pomodoros) will be used by fewer than 10% of users and should not anchor the core experience.

4. **College Board content is copyrighted — this is a content operations problem, not a legal disclaimer.** Practice questions must be original and written from scratch by qualified subject-matter experts. CEDs are permissible as structural reference only (what units exist, what skills are tested, what the point distribution is). Released AP exam questions, released FRQ prompts, and released DBQ document sets cannot be reproduced, closely paraphrased, or used as direct structural templates for algorithmic question generation. The line between "inspired by" and "structurally cloned" is not bright, and College Board has an active legal team that monitors prep companies. The only defensible position is clean-room content creation: SMEs write original questions from scratch with no released question in front of them. This means content creation is slower and more expensive than AI generation from released materials — budget and timeline accordingly. See Section 7 for the SME model that covers both content creation and grading audit.

5. **Revenue targets in this document are targets, not forecasts.** They are directional benchmarks for go/no-go decisions. Do not present them to investors as projections without a supporting acquisition model.

---

## 1. North Star

**North Star Metric:** Number of students who can demonstrate a measurable improvement — defined as ≥10% gain on a practice test OR ≥0.3 GPA improvement in one semester — after 60 days of active use (minimum 3 sessions/week).

**Why this metric:** It is student-observable, parent-legible, and falsifiable. It does not require exam results (which take months) to validate early product quality.

**Mission:** Give every high school student a clear answer to "what should I do right now to improve my grade or AP score" — and then prove it worked.

---

## 2. Who We Are Building For

### Primary User: The Stressed AP Student
- Junior or Senior, taking 2–4 AP courses simultaneously
- Motivated by score outcomes, not love of learning
- Checks grades multiple times per day
- Studies in 15–30 minute bursts, usually at night
- Highly responsive to peer comparison and score predictions
- Will pay (or convince parents to pay) if the value is immediate and visible

### Secondary User: The Grade-Anxious Parent
- Monitors GPA trajectory, not individual assignments
- Wants visibility without surveillance
- Responds to outcome framing ("Your student is on track for a 3.8 this semester")
- Primary payer in the household
- Will refer the product if their child's grades visibly improve

### Who We Are NOT Building For (Right Now)
- Middle school students
- Students not taking AP courses in Phase 1
- Teachers (they are a Phase 4 expansion, not a core user)
- Districts (enterprise sales do not start until product-market fit is proven)

---

## 3. Product Architecture Overview

AceOS is four modules that share a single Student Intelligence Profile (SIP). Modules are launched in sequence — not simultaneously.

```
┌─────────────────────────────────────────────────────┐
│              Student Intelligence Profile            │
│  (Mastery state · GPA trajectory · Study patterns)  │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌───▼────────┐
    │ ScoreBoost  │ │ GradeGuard │ │StudySensei │
    │     AP      │ │            │ │            │
    └─────────────┘ └────────────┘ └────────────┘
           │              │              │
           └──────────────▼──────────────┘
                   ┌──────────┐
                   │SmartPack │
                   │ (Phase 4)│
                   └──────────┘
```

### Module Roles

| Module | Core Job | When It Launches |
|---|---|---|
| **ScoreBoost AP** | Diagnose AP readiness → generate daily practice → grade FRQs → show score trajectory | Phase 1 (Month 1) |
| **GradeGuard** | Track live GPA → alert on risk → answer "what do I need on the final" | Phase 2 (Month 7) |
| **StudySensei** | Guided AI tutoring for concepts students are stuck on, in text and STEM | Phase 3 (Month 13) |
| **SmartPack** | Squad accountability, peer comparison, social retention | Phase 4 (Month 19) |

### How Modules Feed Each Other

- **GradeGuard → ScoreBoost AP:** A failing grade in AP Chemistry triggers reprioritization of the Chemistry unit in the AP study plan.
- **ScoreBoost AP → GradeGuard:** Strong AP practice scores on a unit reduce urgency weighting for that unit in the daily agenda.
- **StudySensei → Both:** When a student is stuck in a tutoring session, the SIP flags that concept as a weak node. It surfaces in both the AP drill queue and the GradeGuard recommendation.
- **SmartPack → All:** Squad weak-spot detection is derived from aggregated SIP data — never individual grades.

---

## 4. Technical Architecture

### 4.1 Infrastructure (PID Model)

The system uses a Provider-Interface-Driver (PID) model. Every vendor is swappable via `model_map.json` without code changes. This matters because AI costs and capabilities are changing fast.

| Component | Phase 1–2 (Validation) | Phase 3+ (Scale) | Swap Trigger |
|---|---|---|---|
| **Frontend** | Vercel (Hobby) | Vercel (Pro) | When bandwidth limits are hit |
| **Backend API** | Render (Free Tier) | Modal.com (Serverless) | When cold-start latency exceeds 2s |
| **Database** | Supabase (Free) | Supabase (Pro) | When row limits or connection pooling is hit |
| **AI Gateway** | LiteLLM routing via `model_map.json` | Same — add models to config | Never re-architect; just update config |
| **Primary AI Model** | GPT-4o (reasoning + vision) | GPT-4o + o3 for logic-heavy tasks | When STEM accuracy falls below 92% |
| **Fast Inference** | Groq (Llama 3.1) for low-stakes responses | Same | When Groq pricing changes |
| **STEM Validation** | Modal.com Python Sandbox (Code Interpreter) | Same | Do not replace — this is the accuracy guarantee |
| **Spaced Repetition** | FSRS-5 algorithm (open source, self-hosted) | Same | Do not replace |
| **Auth** | Supabase Auth (email + Google OAuth) | + Clever SSO (Phase 4) | Phase 4 school channel only |

### 4.2 The Student Intelligence Profile (SIP) Schema

This is the central data object. Every module reads from and writes to it.

```json
{
  "student_id": "uuid",
  "ap_subjects": ["AP Chemistry", "AP US History"],
  "mastery_map": {
    "AP Chemistry": {
      "Unit 1 - Atomic Structure": {
        "mastery": 0.82,
        "last_reviewed": "2026-04-20",
        "fsrs_due": "2026-04-27"
      },
      "Unit 2 - Molecular Geometry": {
        "mastery": 0.41,
        "last_reviewed": "2026-04-18",
        "fsrs_due": "2026-04-24"
      }
    }
  },
  "predicted_ap_scores": {
    "AP Chemistry": 3.2,
    "AP US History": 4.1
  },
  "gpa": {
    "current": 3.6,
    "projected_semester_end": 3.71,
    "target": 3.8
  },
  "ace_rank": {
    "AP Chemistry Unit 2": 0.91,
    "AP US History Unit 7": 0.44
  },
  "study_patterns": {
    "avg_session_length_minutes": 18,
    "peak_study_hour": 21,
    "sessions_per_week": 4
  }
}
```

### 4.3 ACE-Rank Priority Algorithm

This is the formula that drives the daily agenda — what the student should work on right now.

```
ACE-Rank = (AP Exam Weight OR Grade Weight) × (Days Until Exam/Due Date)⁻¹ × (1 - Mastery Score)
```

Higher score = higher priority. This is surfaced as a ranked daily task list, not exposed as a formula to the student.

### 4.4 LMS Browser Extension — Scope and Legal Constraints

The extension is **read-only, DOM-only**. It reads rendered HTML on pages the student is already viewing. It does not:
- Extract session tokens
- Make authenticated API calls on behalf of the student
- Store credentials
- Run when the student is not on the LMS page

Supported LMS targets: Canvas, Schoology, Google Classroom (Phase 2).  
Legal review required before Sprint 9 ships. If legal review fails, Phase 2 launches with manual grade entry only.

---

## 5. Pricing

| Tier | What's Included | Price | Target Buyer |
|---|---|---|---|
| **Free** | ScoreBoost AP diagnostic (one subject), predicted score, 10 practice questions | $0 | Student (acquisition hook) |
| **AP Sprint Pack** | Full ScoreBoost AP for one subject, 90 days | $49 one-time | Parent (low-commitment entry) |
| **Student Pro** | All active modules, unlimited practice, FRQ grading | $19.99/mo or $149/yr | Parent |
| **Family Plan** | Student Pro for up to 3 students | $29.99/mo or $219/yr | Parent with multiple kids |
| **School License** | All modules, teacher dashboard, admin analytics | $6/student/mo (min 50 students) | Schools (Phase 4 only) |

**Pricing notes:**
- The AP Sprint Pack is the most important conversion tool. It removes subscription anxiety and targets the highest-urgency moment (AP season). One-time purchase means parents who are skeptical of subscriptions will still buy.
- Annual plans should be pushed aggressively from Month 6 onward. Annual users churn at roughly half the rate of monthly users.
- Do not launch the School License until Phase 4. Selling to schools before FERPA audit is complete is a legal risk.

---

## 6. FERPA & Privacy Architecture

This section is Phase 1, not Phase 4.

### What FERPA Requires
- Student education records cannot be shared with third parties without parental consent (for students under 18)
- Schools that share data with vendors must have a signed Data Processing Agreement (DPA)
- Students over 18 can consent for themselves

### How AceOS Handles This

| Data Type | Storage | Access |
|---|---|---|
| Grade data | Supabase, encrypted at rest | Student only + parent (with student consent) |
| Mastery/SIP data | Supabase, encrypted at rest | Student only + parent (with student consent) |
| Aggregated analytics | Anonymized before storage | Internal only |
| Squad/social data | Decoupled from grade data at schema level | Squad members see aggregate mastery, never individual grades |

**Required before any student onboards:**
- [ ] Legal review of data handling practices
- [ ] Privacy policy written by a lawyer, not internally
- [ ] Parental consent flow for students under 18
- [ ] Data Processing Agreement template for Phase 4 school sales

---

## 7. Human Review Architecture

This section exists because the previous roadmap drafts (v14.0 and v4.1) both made the same mistake: they placed human review downstream, as a real-time safety net on individual AI grading outputs. That design fails at scale for three reasons that compound each other:

1. **LLMs are confidently wrong, not just uncertainly wrong.** A confidence-score threshold catches the AI when it is confused. It does not catch the AI when it is wrong with high confidence — which is the more dangerous failure mode in FRQ grading, where nuanced humanties essays can be mis-graded persuasively.
2. **A 48-hour review turnaround breaks the learning loop.** Students submitting FRQs at 9pm before an exam need feedback that night, not two days later. A flagged response that goes into a queue is a broken experience at the highest-engagement moment.
3. **Per-response SME review is not cost-neutral at scale.** At 250,000+ FRQs in Phase 3, even a 5% flag rate is 12,500 human reviews. At $3–5 per review, that is a $37K–$62K seasonal cost spike concentrated in the 6 weeks before AP exams.

The correct design moves human work **upstream into content** and **sideways into sampling** — not downstream into real-time response queues.

### The Three-Tier Human Review Model

#### Tier 1: Pre-Launch Content Audit (Upstream)
**What it catches:** Wrong rubric templates, inaccurate model answers, bad diagnostic questions, rubric language that does not match College Board criteria.  
**When it happens:** Before each subject launches. Non-negotiable gate. No subject ships without passing this audit.  
**Who does it:** Hired AP teachers or College Board-certified AP readers (College Board trains AP exam readers annually — these are the gold standard for FRQ calibration). Minimum one SME per subject at launch.  
**What they review:**
- Every rubric template used for grading (each rubric point definition)
- Every model answer used for post-grading reference
- A sample of 50 AI-graded FRQs for that subject, scored independently, compared to AI output
- Agreement threshold: AI rubric point agreement must match SME scoring within ±1 point on 80% of essays before the subject launches

**Cost model:** Fixed cost per subject launch, not per student. Approximately $500–$1,500 per subject depending on exam complexity (STEM subjects take longer). This is a content quality cost, not a grading cost.

**Implication:** The AI grading quality is determined almost entirely by the quality of the rubric templates and model answers it grades against. If these are correct, the AI will be correct most of the time by default. Human work at this tier has an order-of-magnitude higher leverage than human work at the response-review tier.

---

#### Tier 2: Ongoing Random Sample Audit (Sideways)
**What it catches:** AI grading drift over time, systematic errors on specific question types, quality degradation after model updates.  
**When it happens:** Weekly, every week, permanently. This is not a launch activity — it is an operational process.  
**Who does it:** Part-time SME contractors, paid per batch.  
**How it works:**
- Every week, 2% of all FRQ responses graded that week are randomly selected (stratified by subject and FRQ type)
- SME scores each selected response independently, without seeing the AI's score first
- AI score and SME score are compared. Agreement rate is tracked as a KPI.
- **Agreement threshold:** If the AI-to-SME agreement rate drops below 75% in any subject in any week, that subject's FRQ grading is flagged for review. If it drops below 65%, FRQ grading for that subject is paused until root cause is identified and fixed.
- Results are reviewed weekly by the product team. Trend data (improving or degrading agreement) is more important than any single week's number.

**Cost model at scale:**
- Phase 1 (5,000 FRQs/month): 100 sampled FRQs/month at ~$4/review = ~$400/month
- Phase 2 (25,000 FRQs/month): 500 sampled FRQs/month = ~$2,000/month
- Phase 3 (200,000 FRQs/month): 4,000 sampled FRQs/month = ~$16,000/month

This is a predictable, budgetable operational cost — not a spike. It also generates the most valuable data set in the company: a ground-truth library of human-graded FRQs that can be used to retrain and improve the grading model over time.

---

#### Tier 3: Student-Triggered Review (On Demand)
**What it catches:** Individual cases where the AI graded incorrectly and the student knows it.  
**When it happens:** On demand, initiated by the student.  
**Who does it:** SME contractor, same pool as Tier 2.  
**How it works:**
- Any student can flag a graded FRQ as "I disagree with this score" with one tap
- They provide a brief reason (optional, dropdown: "Missing rubric point" / "Rubric point unfairly denied" / "Feedback doesn't make sense")
- The response goes into a review queue. SME reviews within 24 hours.
- If the AI was wrong: the student's score is updated, the student is notified, and the case is logged as a training signal
- If the AI was right: student is notified with an explanation of why the original score stands
- Expected flag rate: less than 1% of submissions (based on comparable AI grading products). At Phase 3 volume, this is approximately 2,000 flagged FRQs/month, or roughly 2,000 SME reviews/month at $4/review = $8,000/month

**Why this matters beyond accuracy:** A student who disagrees with a grade and gets a human review within 24 hours is a student who trusts the product. This tier is as much a trust mechanism as it is a quality mechanism.

---

### What This Model Does Not Include

- **Real-time flagging queues based on AI confidence scores:** Removed. Confidence scores do not reliably identify the most dangerous failure mode (confident wrong answers). The sample audit catches systematic errors more reliably.
- **Human review for diagnostic multiple-choice questions:** Not required. Multiple-choice answers are unambiguous. The Python sandbox handles STEM answer verification. The only grading that requires human judgment is open-ended FRQ responses.
- **Human review for StudySensei tutoring conversations:** Not required. Tutoring conversations are not scored — they are dialogues. Quality is measured through the downstream outcome: does the student answer the next practice question on that concept correctly?

---

### Human Review KPIs

These metrics are tracked weekly by the product team and reviewed monthly.

| Metric | Green | Yellow | Red (Action Required) |
|---|---|---|---|
| **Pre-launch audit pass rate** | 100% of subjects audited before launch | — | Any subject launched without audit |
| **Weekly sample agreement rate (per subject)** | ≥80% | 75–79% | <75% — trigger investigation; <65% — pause FRQ grading for subject |
| **Student flag rate** | <1% of FRQs | 1–2% | >2% — systematic quality problem |
| **Tier 3 review turnaround** | <24 hours | 24–48 hours | >48 hours — breach of student trust |
| **SME-corrected scores (% of Tier 3 reviews)** | <15% (AI mostly right) | 15–25% | >25% — model needs retraining |

---

## 8. Go-To-Market Strategy

### Phase 1 GTM: AP Season Organic (Months 1–6)

**Primary hook:** "Get your AP essay graded by AI in 60 seconds."  
This is the most concrete, immediately valuable thing the product does. It requires no setup, no habit change, and delivers visible value in a single session.

**Channels:**
- Reddit: r/APStudents, r/ApplyingToCollege, r/CollegeBoard — contribute genuinely useful content, not ads
- Discord: AP subject servers — direct student outreach
- TikTok/YouTube: Approach 3–5 micro-creators in the study/AP niche with free Pro access in exchange for honest reviews. Do not pay for scripted promotions.
- AP teachers: Email outreach offering free class accounts for teachers to pilot. Teachers who recommend the product to their class are worth 20–30 students each.

**Conversion path:** Free diagnostic → predicted score → "Unlock your full study plan" (Sprint Pack or Pro)

**What not to do in Phase 1:**
- Paid ads (CAC will be too high before organic validation)
- School district outreach (too slow and legally premature)
- Press releases (nothing to announce yet)

### Phase 2 GTM: Parent Channel (Months 7–12)

**Primary hook:** "See your student's GPA trajectory before report card day."  
Parents are the payer. Give them something they cannot get from the school — a forward-looking view, not just a backward-looking grade.

**Channels:**
- Facebook parent groups for high school students in high-AP districts (California, Texas, New York, New Jersey, Virginia are top AP states)
- Nextdoor in affluent school districts
- Email referral: existing Student Pro users invite parents; parents can share with other parents

### Phase 3–4 GTM: School Channel + PR (Months 13–24)

- School counselor outreach with outcome data from Phase 1–2
- PR around measurable student outcomes (requires real data — do not do this early)
- College Board partnership is not a near-term realistic option. Do not plan around it.

---

## 8. Execution Plan: Phase by Phase, Sprint by Sprint

---

### PHASE 1: ScoreBoost AP (Months 1–6)

**Goal:** Prove the product improves AP scores before May 2027. Win paying users in AP season.  
**Scope rule:** Only ScoreBoost AP ships in this phase. GradeGuard, StudySensei, SmartPack are not built. Resist scope creep.

#### Phase 1 OKRs

**O1: Ship a product students will pay for.**
- KR1: 500 students complete a full AP diagnostic within 60 days of launch
- KR2: 70% of students who complete the diagnostic return within 7 days
- KR3: $5,000 MRR by Month 3 (approx. 100 Sprint Pack purchases)
- KR4: $20,000 MRR by Month 6 (approx. 400 Sprint Pack purchases or ~800 Pro subscribers)

**O2: Prove score improvement.**
- KR1: Students who complete ≥3 sessions/week show ≥10% practice score improvement within 4 weeks (measured in-app)
- KR2: Predicted AP score accuracy: model prediction within ±0.5 of actual practice performance for 70% of users
- KR3: NPS ≥ 50 by Month 5

**O3: Build the data foundation.**
- KR1: ≥10,000 diagnostic responses collected
- KR2: ≥5,000 FRQs graded
- KR3: Mastery state computed for every active user at every unit level

---

#### Epic 1: Foundation & Legal (Sprints 1–2)

**Sprint 1 — Weeks 1–2: Infrastructure + Identity + Compliance Foundation**

Deliverables:
- Supabase project setup: auth, database schema (SIP v0), row-level security policies
- Vercel frontend deployment pipeline
- LiteLLM gateway configured with GPT-4o and Groq (Llama 3.1) routing via `model_map.json`
- Student onboarding flow: email signup, Google OAuth, age gate (under 18 → parental consent email)
- Subject selection screen: start with 6 subjects only (AP Chemistry, AP Biology, AP US History, AP World History, AP English Language, AP Calculus AB)
- Privacy policy and Terms of Service live (lawyer-reviewed)
- FERPA data handling documentation complete
- **College Board content legal review complete:** Education attorney reviews the content creation process before any SME writes a single question. Output of this review is a written Content Creation Protocol document that every SME contractor receives and signs before starting work. The protocol defines: what CEDs can be used for (structural reference only), what is prohibited (reproducing or templating from released questions), and how original content is defined and documented. This document is the legal paper trail if College Board ever challenges the content.
- **SME contractor agreements drafted:** Content creation agreement template reviewed by legal counsel. All SMEs sign before receiving any content brief. Agreement explicitly prohibits use of any released AP exam material as a direct template.

**Definition of Done:** A student can sign up, confirm parental consent (if under 18), select an AP subject, and reach the dashboard — with all data encrypted at rest and row-level security enforced. College Board content legal review is complete and Content Creation Protocol is signed off before any diagnostic questions are written.

---

**Sprint 2 — Weeks 3–4: Modal.com Sandbox + AI Gateway Validation**

Deliverables:
- Modal.com Python sandbox deployed for STEM answer validation (this runs student-submitted math/science answers through a Python interpreter to verify correctness — not LLM self-audit)
- LiteLLM routing tested: text questions → GPT-4o, fast low-stakes responses → Groq, STEM validation → Modal sandbox
- Prompt templates versioned in codebase (not hardcoded in application logic)
- Error handling for AI failures: fallback responses, retry logic, user-visible error states
- Internal QA: 50 test questions run through the full pipeline, accuracy manually audited

**Definition of Done:** The AI pipeline routes correctly, STEM answers are validated via code execution (not LLM), and the system degrades gracefully when any vendor is unavailable.

---

#### Epic 2: Diagnostic & Predicted Score (Sprints 3–4)

**Sprint 3 — Weeks 5–6: Text-Subject Diagnostic**

Deliverables:
- 50-question diagnostic for each of the 4 text-heavy subjects (AP US History, AP World History, AP English Language, AP English Literature)
- Questions are original — written from scratch by subject-matter experts following the Content Creation Protocol established in Sprint 1. No released AP question is used as a template at any stage, including drafting. SMEs work from the CED skill descriptors only, not from released exam banks. AI may be used to generate first drafts, but every AI-generated question must be fully rewritten by an SME before use — AI output is a starting point for human authorship, not a finished product.
- Question types: multiple choice with 4 options (one correct, one partially plausible, two clearly wrong — mirrors College Board format in structure, not content)
- Diagnostic is timed: 45-minute limit, auto-submits
- After submission: unit-level heatmap showing mastery by topic area
- Predicted AP score (1–5) with confidence range (e.g., "Predicted: 3 | Range: 2–4")
- Predicted score methodology: logistic regression on diagnostic performance by unit, calibrated against historical College Board score distributions (public data)

**Definition of Done:** A student in AP US History can complete the 50-question diagnostic, see their unit heatmap, and get a predicted AP score with an explanation of what is dragging it down.

---

**Sprint 4 — Weeks 7–8: STEM Diagnostic**

Deliverables:
- 50-question diagnostic for AP Chemistry, AP Biology, AP Calculus AB
- STEM questions include: multiple choice with numerical answers, graph interpretation, formula application
- Student can upload a photo of handwritten work (GPT-4o Vision pipeline: image → LaTeX → evaluated against correct solution path)
- Handwriting upload is optional — typed input is the default
- STEM answers validated via Modal.com Python sandbox, not LLM
- Same heatmap and predicted score output as Sprint 3

**Definition of Done:** A student in AP Chemistry can submit a multi-step calculation (typed or handwritten photo), see where their reasoning broke down, and get a predicted AP score.

---

#### Epic 3: Daily Practice Loop (Sprints 5–6)

**Sprint 5 — Weeks 9–10: Personalized Study Plan + Daily Queue**

This is the most important retention sprint. If a student does not know what to do when they open the app on Day 2, they will not return.

Deliverables:
- Study plan generated from diagnostic: ordered list of units by ACE-Rank priority score
- Daily review queue: 10–15 questions per day, surfaced by FSRS-5 scheduler (due dates computed per card, per student)
- Queue has a hard cap of 15 questions. Students who want more can drill manually. Overwhelming students kills retention.
- Estimated time shown per session ("Today's review: ~18 minutes")
- Session completion screen: shows questions completed, mastery delta, next due date
- FSRS-5 integration: correct answers push the card's next review date forward; wrong answers reset the interval

**Definition of Done:** A returning student opens the app and sees exactly what to review today, with a time estimate, and their mastery scores update after completing the session.

---

**Sprint 6 — Weeks 11–12: Wrong-Answer Explainer + Drill Mode**

Deliverables:
- After every wrong answer: step-by-step explanation of why the correct answer is correct
- For STEM: explanation walks through the solution path, identifies the specific step where the student's reasoning failed (Socratic failure-point detection — v14.0's strongest mechanic)
- The explanation does NOT give away the answer first. It identifies the failure point and asks a guiding question. If the student gets it wrong a second time, the full solution is shown.
- Drill mode: student can manually select any unit and drill weak concepts on demand (for the night-before cram use case)
- Drill mode is not spaced — it is immediate repetition of the student's weakest cards in the selected unit

**Definition of Done:** A student who gets a stoichiometry question wrong sees exactly which step in the calculation broke down, gets a guiding question, and can drill the full unit on demand.

---

#### Epic 4: FRQ Grader (Sprints 7–8)

This is the product's highest-value feature and the primary conversion driver. A student submits a free-response answer and gets rubric-aligned feedback within 60 seconds.

**Sprint 7 — Weeks 13–14: Essay FRQ Grader (Humanities)**

Deliverables:
- FRQ submission portal: student selects subject, prompt type (DBQ, LEQ, SAQ), pastes or types their response
- Rubric-aligned grading: AP rubrics are public. Each rubric point is evaluated independently.
- Output: rubric heatmap overlay — each rubric point is marked as earned, partially earned, or missing, with a one-sentence explanation
- Line-level feedback: specific sentences in the student's essay are annotated with what they accomplished or what is missing
- Score out of rubric maximum (e.g., 7/10 for a DBQ)
- One model response generated for reference — not shown immediately, shown only after student reads their own feedback
- Revision loop: student can resubmit after revising and see their score change

**Pre-launch content audit (Tier 1 — required gate before this sprint ships):**
- All rubric templates for APUSH, AP Lang, AP Psych, and AP Gov reviewed and approved by hired AP readers
- All model answers reviewed and approved by subject-matter experts
- 50 AI-graded FRQs per subject scored independently by SME. Agreement rate must reach ≥80% before the FRQ grader goes live.
- This audit is a hard stop. The FRQ grader does not ship until this passes. A failed audit means the rubric templates are revised and re-audited — not that the threshold is lowered.

**Ongoing sample audit (Tier 2 — begins the week FRQ grader ships):**
- Starting Week 13, 2% of all graded FRQs are randomly pulled each week for SME review
- Agreement rate tracked weekly. If it drops below 75% in any subject, that subject is flagged. Below 65%, FRQ grading for that subject pauses.

**Student dispute flow (Tier 3 — ships with the FRQ grader):**
- "Dispute this score" button available on every graded FRQ
- Disputed responses reviewed by SME within 24 hours
- Student notified of outcome with explanation

**Definition of Done:** A student submits an AP US History DBQ and receives a rubric heatmap, line-level annotations, and a score — with the option to revise and resubmit. Pre-launch audit is complete and Tier 2 sampling is running.

---

**Sprint 8 — Weeks 15–16: STEM Free-Response Grader**

Deliverables:
- STEM FRQ submission: student types multi-step solution or uploads handwritten photo
- GPT-4o Vision: handwritten photo → LaTeX → solution path evaluated step by step
- Modal.com sandbox validates numerical answers independently
- Output: step-by-step breakdown showing which steps earned points and which did not
- For partial credit: identifies the last correct step before the error propagated
- Score out of rubric maximum
- Revision loop: student can resubmit corrected work

**Definition of Done:** A student submits a handwritten AP Chemistry free-response and receives step-by-step grading with specific identification of where credit was lost.

---

#### Epic 5: Exam Simulator + Monetization (Sprints 9–12)

**Sprint 9 — Weeks 17–18: Bluebook-Style Full-Length Practice Exam (Text)**

AP exams are going fully digital via Bluebook. The practice environment should mirror this.

Deliverables:
- Full-length timed practice exam for text subjects (matching real exam length and section structure)
- Clean, distraction-free interface (no sidebar, no score visible during exam)
- Essay section: plain text editor with word count, no formatting tools (matches Bluebook)
- Auto-submits when time expires
- Post-exam report: section scores, unit breakdown, time-per-question analysis, predicted AP score update
- Score trend chart: shows diagnostic score → practice exam scores over time

**Definition of Done:** A student can sit a full-length AP US History practice exam in a Bluebook-accurate interface and receive a complete post-exam report.

---

**Sprint 10 — Weeks 19–20: Bluebook-Style Full-Length Practice Exam (STEM)**

Deliverables:
- Full-length timed practice exam for STEM subjects
- Scratch-pad section: digital drawing/equation workspace alongside the question (matches a real Bluebook feature)
- Photo upload for handwritten work during the exam
- Same post-exam report as Sprint 9
- Formula reference sheet available (matches what College Board provides on the actual exam)

**Definition of Done:** A student can sit a full-length AP Chemistry practice exam with a digital scratch pad and receive step-by-step graded free-response feedback.

---

**Sprint 11 — Weeks 21–22: Subject Expansion + QA + Human Review Ops**

Deliverables:
- Add AP English Literature and AP Statistics to supported subjects (total: 8 subjects)
- **Pre-launch content audit for new subjects:** AP English Lit and AP Statistics rubric templates and model answers reviewed and approved by SMEs before these subjects go live. Same ≥80% agreement threshold applies.
- Full QA pass on all diagnostic, practice, and FRQ flows for all 8 subjects
- Performance testing: all AI responses under 8 seconds at 95th percentile (this is the user-tolerance threshold)
- Accessibility pass: keyboard navigation, screen reader compatibility for core flows
- Bug bash: internal team + 20 beta students; all P1 issues resolved before Sprint 12
- **Human review operations setup:**
  - Internal dashboard for Tier 2 (weekly sample audit): shows randomly selected FRQs, side-by-side AI score vs. SME score entry, agreement rate per subject per week
  - Internal dashboard for Tier 3 (student disputes): queue of disputed FRQs, SME review interface, student notification trigger
  - SME contractor network established: minimum 2 qualified AP readers per subject (for redundancy)
  - Weekly sample audit process documented and running (first sample pulled from Sprint 7–10 FRQ volume)
- **First Tier 2 audit report reviewed internally:** What is the agreement rate per subject after the first 4 weeks of live grading? Are there systematic failure patterns? This report informs Phase 2 content priorities.

**Definition of Done:** All 8 subjects pass QA. No P1 bugs open. AI response time under 8s at P95. Tier 2 weekly sample audit is running and producing a report. Tier 3 dispute queue is live and first disputes have been reviewed within 24 hours.

---

**Sprint 12 — Weeks 23–24: Monetization + Soft Launch**

Deliverables:
- Free tier gates: diagnostic (one subject), predicted score, 10 practice questions, 1 FRQ grading attempt
- AP Sprint Pack ($49 one-time): full access for one subject, 90 days
- Student Pro ($19.99/mo): all subjects, unlimited
- Stripe integration: payment, subscription management, upgrade/downgrade flows
- Referral link: student shares a personalized link; referee gets 7-day free Pro trial
- Launch: California soft launch via AP subreddit, Discord, and 5 teacher partnerships
- Analytics: Mixpanel (or equivalent) event tracking live on all key flows (diagnostic start, diagnostic complete, FRQ submit, paywall hit, conversion)

**Definition of Done:** Paying users can sign up, access the correct tier features, and the team can see conversion funnel data in the analytics dashboard.

---

### PHASE 2: GradeGuard (Months 7–12)

**Goal:** Become a year-round tool, not just an AP-season product. Build the parent relationship.  
**Scope rule:** GradeGuard ships in this phase. StudySensei does not. Add features to ScoreBoost AP only if Phase 1 data reveals specific gaps.

#### Phase 2 OKRs

**O1: Retention — students return when it is not AP season.**
- KR1: 55% of Phase 1 active users activate GradeGuard within 30 days of launch
- KR2: Average session frequency increases from 3x/week → 4.5x/week
- KR3: 30-day retention improves from 40% (Phase 1 baseline) → 60%

**O2: GPA outcomes.**
- KR1: 35% of active GradeGuard users improve GPA by ≥0.3 points in one semester (self-reported + in-app tracking)
- KR2: Parent satisfaction score ≥ 4.3/5 (in-app survey)

**O3: Revenue.**
- KR1: $50,000 MRR by Month 9
- KR2: $100,000 MRR by Month 12
- KR3: Annual plan conversion ≥ 25% of new paid subscribers

---

#### Epic 6: GPA Tracking Core (Sprints 13–14)

**Sprint 13 — Weeks 25–26: Grade Tracker + Live GPA Calculator**

Deliverables:
- Class setup: student adds classes, sets grade weights (weighted/unweighted GPA toggle)
- Assignment entry: name, category (test, homework, quiz, project), score received, score possible, date
- Live GPA calculation: updates in real time as assignments are entered
- GPA display: current semester GPA, cumulative GPA, weighted and unweighted views
- Grade history: assignment list per class, sortable by date and category
- Data persistence: grades survive app restarts (basic requirement that has broken many edtech products)

**Definition of Done:** A student can set up 4 classes with grade weights, enter 2 weeks of grades, and see their live GPA update correctly.

---

**Sprint 14 — Weeks 27–28: What-If Simulator + GPA Arc + Alerts**

This sprint addresses the single most-asked question in every high school student's life: "What do I need on the final to get an A?"

Deliverables:
- What-If Simulator: student enters a hypothetical future score → GPA projection updates in real time
- "What do I need?" calculator: student sets a target grade → system back-calculates the minimum score needed on remaining assignments
- GPA Arc chart: visual curve showing current GPA vs. projected semester-end GPA
- Grade drop alert: if a new grade drops a class average below a student-set threshold, push notification fires
- Class risk flag: any class below a B- flagged red on the dashboard
- Semester projection: "If you maintain your current pace, you will end the semester at 3.62 GPA"

**Definition of Done:** A student can enter "I need an A- in AP Chemistry" and immediately see what score they need on the remaining final exam, given their current grades.

---

#### Epic 7: Browser Extension + Passive Sync (Sprints 15–16)

**Sprint 15 — Weeks 29–30: Browser Extension Scaffold**

**Important:** The extension reads DOM only. No token extraction. Legal review must be complete before this sprint ships. If legal review is not complete, sprint ships with manual entry only and the extension is deferred to Sprint 16.

Deliverables:
- Chrome and Edge extension scaffold
- Detects when student is on Canvas or Schoology (URL pattern matching)
- On detection: reads rendered grade tables from the DOM (same data the student can already see)
- Extracts: class name, assignment name, score, category, weight
- Prompts student to confirm import before writing to AceOS
- Manual override: student can edit any imported grade
- No background sync. Extension only runs when student actively visits the LMS page.

**Definition of Done:** A student on Canvas can click the AceOS extension icon and import their current grades with one confirmation click.

---

**Sprint 16 — Weeks 31–32: Unified Daily Agenda + Cross-Module Recommendations**

This sprint connects GradeGuard and ScoreBoost AP for the first time.

Deliverables:
- Unified daily agenda: single list combining AP practice queue (from FSRS-5 scheduler) and class-specific action items (from GradeGuard risk flags)
- ACE-Rank drives prioritization: items ordered by formula, not by subject
- Cross-module recommendation: if AP Chemistry class grade drops, AP Chemistry units move up in the ScoreBoost daily queue automatically
- Estimated time per day: "Today's agenda: ~22 minutes"
- Burnout risk flag: if the student's scheduled study time exceeds 3 hours/day for 5 consecutive days, a recommendation to reduce scope appears (this is a trust signal for parents, not an engagement hack)

**Definition of Done:** A student opens the app and sees a single prioritized agenda combining AP review and class grade actions, with accurate time estimates.

---

#### Epic 8: Parent Layer (Sprints 17–18)

**Sprint 17 — Weeks 33–34: Parent Account + Dashboard**

The parent layer must be built on consent, not surveillance. Students control what parents see.

Deliverables:
- Parent account creation: parent creates account, sends invite to student's email
- Student approval flow: student approves the link (required — student can revoke at any time)
- Parent dashboard shows:
  - Current GPA (live)
  - GPA trend chart (last 4 weeks)
  - "On track / At risk" status per class (green/yellow/red)
  - AP predicted scores (if student has enabled ScoreBoost)
  - Upcoming high-stakes assignments (tests, projects — flagged by weight)
  - Last active date ("Your student last used AceOS 2 days ago")
- Parent dashboard does NOT show: individual assignment scores, specific grades, chat history, session content
- Weekly summary email to parent: GPA delta, biggest risk flag, biggest improvement

**Definition of Done:** A parent can see their student's overall academic health in one view without seeing individual grades or assignment details, subject to student consent.

---

**Sprint 18 — Weeks 35–36: Mobile PWA + Push Notifications + Phase 2 QA**

Deliverables:
- Progressive Web App (PWA): installable on iOS and Android home screen
- Offline grade entry: student can log grades without internet connection; syncs when connection returns
- Push notifications (web push for PWA):
  - Daily agenda reminder (student-set time, default 7pm)
  - Grade drop alert
  - AP exam countdown (30 days, 14 days, 7 days, 1 day)
  - Parent weekly summary email
- Notification preferences: student controls all notification types independently
- Full QA pass on GradeGuard and parent flows
- Performance: GPA calculation renders under 500ms for up to 10 classes and 200 assignments

**Definition of Done:** A student can install AceOS as a PWA, enter a grade offline, and their parent receives the correct weekly summary email.

---

### PHASE 3: StudySensei (Months 13–18)

**Goal:** When a student is stuck, AceOS is the first place they go — not Google, not ChatGPT.  
**Scope rule:** StudySensei text tutoring ships first. Voice tutoring is a Phase 3 stretch goal only — do not block the Phase 3 launch on it.

#### Phase 3 OKRs

**O1: Make tutoring central.**
- KR1: 60% of active users engage with StudySensei at least once per week by Month 15
- KR2: Students who complete a tutoring session score ≥15% higher on the next practice quiz for that concept (measured automatically)
- KR3: Average session length increases from 18 min → 24 min after StudySensei activation

**O2: Own AP foreign language prep.**
- KR1: 800 AP Spanish students activate the language experience within 60 days of launch
- KR2: Diagnostic completion rate ≥ 60% for AP Spanish

**O3: Revenue.**
- KR1: $150,000 MRR by Month 15
- KR2: $200,000 MRR by Month 18
- KR3: Monthly churn drops below 7%

---

#### Epic 9: Text Tutoring Core (Sprints 19–20)

**Sprint 19 — Weeks 37–38: StudySensei Text Tutoring (Humanities)**

Deliverables:
- Tutoring chat interface: student types a question or pastes a concept they are stuck on
- AI tutor does NOT give the answer first. It asks a guiding question to probe what the student already understands. On the second exchange, if the student is still stuck, it provides a structured explanation.
- This is the Socratic mechanic from v14.0 — applied as the first step in the tutoring sequence, not a rigid rule that blocks help
- The tutor is aware of the student's SIP: "I can see you scored low on causation arguments in your DBQ. Is that what you're working on?"
- Session memory: within a session the tutor remembers what has been covered. Between sessions it knows the student's weak units.
- "Simpler explanation" button: student can request a simpler explanation at any point, no penalty
- Session summary at end: what was covered, what concepts to review next
- Tutoring session feeds back to SIP: demonstrated understanding → mastery score for that unit increases

**Definition of Done:** A student can ask StudySensei to help them understand the causes of World War I, receive Socratic guidance, and see their APUSH Unit 7 mastery score update after the session.

---

**Sprint 20 — Weeks 39–40: STEM Tutoring**

Deliverables:
- STEM tutoring: student types a problem or uploads a photo of their work
- For multi-step problems: tutor works through the solution one step at a time, asking the student to complete each step
- If the student's step is wrong: tutor identifies exactly which part of the step is incorrect (Socratic failure-point detection from v14.0)
- If the student's step is correct: tutor confirms and moves to the next step
- Equation renderer: math displayed in formatted equations, not raw text
- Modal.com sandbox validates each student step numerically (not LLM self-audit)
- Graph interpretation: student can upload a graph image; tutor discusses it in context

**Definition of Done:** A student working through a thermodynamics problem can submit each step and receive targeted feedback on exactly where their reasoning fails.

---

#### Epic 10: AP Subject Expansion + Language (Sprints 21–22)

**Sprint 21 — Weeks 41–42: Expand to 14 AP Subjects**

Add: AP Psychology, AP Government & Politics, AP Economics (Macro and Micro), AP Environmental Science, AP Physics 1

Deliverables for each new subject:
- 50-question diagnostic
- Unit heatmap
- Predicted AP score
- Study plan generation
- FRQ grader (where FRQs exist)
- Daily review queue (FSRS-5 integrated)
- StudySensei text tutoring

**Quality gate:** Same QA process as Sprint 11. All 14 subjects pass before launch.

---

**Sprint 22 — Weeks 43–44: AP Spanish Language Foundation**

AP Spanish is the #2 most-taken AP exam nationally. It warrants its own sprint.

Deliverables:
- AP Spanish Language diagnostic: reading comprehension, written expression
- Spoken response FRQ: student records a spoken response; Whisper (STT) transcribes; AI grades against AP speaking rubrics
- Written FRQ grader: interpersonal and presentational writing rubrics
- Pronunciation feedback: identifies specific phonemes that differ from standard pronunciation — optional, student opt-in, not accent-shaming
- Target-language tutor: student can request that StudySensei conduct the tutoring session entirely in Spanish
- Language Add-On tier: $4.99/mo add-on, or included in Student Pro

**Definition of Done:** An AP Spanish student can complete the diagnostic, submit a spoken response, receive rubric-aligned feedback, and practice with a Spanish-language tutor.

---

#### Epic 11: SIP v2 + Subject Completion (Sprints 23–24)

**Sprint 23 — Weeks 45–46: Expand to 20 AP Subjects + SIP Predictive Layer**

Add: AP French Language, AP Statistics (full), AP Computer Science A, AP Art History, AP Human Geography, AP Physics C

SIP v2 additions:
- Optimal study window: based on historical performance by time of day and session length, recommend the best time and duration to study each subject
- Early warning: if a student's practice score trend declines over 2 consecutive weeks, trigger a recommendation (shown to student and parent)
- Cross-subject transfer: if a student masters statistical reasoning in AP Statistics, this is surfaced in their AP Psychology mastery map
- Long-term GPA projection: 12-month GPA arc based on current trends

**Definition of Done:** All 20 subjects pass QA. SIP v2 is generating recommendations for at least 80% of active users.

---

**Sprint 24 — Weeks 47–48: Phase 3 QA + Performance Hardening**

Deliverables:
- Full regression QA on all 20 subjects across all modules
- Load testing: simulate 5,000 concurrent users; identify and resolve bottlenecks
- Redis caching: implement for dashboard data, GPA calculations, SIP reads (high-frequency, low-change data)
- AI cost audit: calculate actual cost per student per month at current usage levels; identify optimization opportunities
- Phase 3 retrospective: OKR review, user research synthesis, Phase 4 plan validation

---

### PHASE 4: SmartPack + Teacher Layer (Months 19–24)

**Goal:** Turn individual outcomes into social growth. Open the school channel.  
**Scope rule:** SmartPack launches only after Phase 3 retention is stable. Do not build social features on top of a leaky product.

#### Phase 4 OKRs

**O1: Social retention.**
- KR1: 25% of new signups come from squad invites by Month 22
- KR2: Average squad size reaches 3.5 students
- KR3: Squad users show 1.8x higher 30-day retention vs. non-squad users

**O2: School channel.**
- KR1: 5 school pilots live by Month 24
- KR2: First $15,000 MRR from school licenses
- KR3: FERPA audit complete and documented

**O3: Revenue.**
- KR1: $300,000 MRR by Month 21
- KR2: $400,000 MRR by Month 24

---

#### Epic 12: SmartPack (Sprints 25–27)

**Sprint 25 — Weeks 49–50: Squad System**

Deliverables:
- Squad creation: student creates a squad (max 6 members), invites by link or username
- Squad dashboard: shows each member's aggregate mastery by subject — never individual grades or assignment scores
- Squad heatmap: visual grid of subjects × members, colored by mastery (green/yellow/red) — data is rounded and binned so individual performance cannot be reverse-engineered from the display
- Leaderboard: optional, student opt-in only. Ranks squad members by weekly study consistency (sessions completed), not by GPA or score
- Squad challenge: any member can challenge the group to complete a specific AP unit by a deadline. Completion tracked.
- Privacy controls: student can leave a squad and their data is immediately removed from the squad view

**Definition of Done:** A student can create a 4-person squad, see a mastery heatmap that shows subject-level strengths without revealing grades, and track a group challenge.

---

**Sprint 26 — Weeks 51–52: Shared Weak-Spot Detection + AceIt Dashboard Shell**

Deliverables:
- Shared weak-spot detection: if 3+ squad members have low mastery on the same AP unit, the squad is notified ("Your group is weak on Unit 5 AP Chemistry — study together?")
- Group study invitation: push notification to squad when a shared weak spot is detected
- AceIt Dashboard shell — new default home screen containing:
  - Daily intelligence brief ("You have 3 items due today. Biggest risk: AP Chem Unit 2")
  - Unified progress ring (% of today's agenda complete)
  - Priority action queue (top 3 items by ACE-Rank)
  - AP exam countdown with readiness score
  - Squad activity feed

---

**Sprint 27 — Weeks 53–54: Full Dashboard + Stealth Streaks**

Deliverables:
- Dashboard becomes the default landing screen for all users
- Stealth streaks: consistency streak tracked passively, shown on profile. Not shown on squad leaderboard by default. Student can choose to share.
- Parent share view: parent sees a simplified version of the AceIt dashboard (GPA, readiness score, streak) — same consent model as Phase 2
- Notification center: unified feed of all alerts (grade drops, squad activity, exam countdowns, burnout flags)

---

#### Epic 13: Teacher Dashboard + School Channel (Sprints 28–30)

**Sprint 28 — Weeks 55–56: FERPA Audit + Teacher Dashboard Logic**

This sprint is primarily non-code work. Do not skip it.

Deliverables:
- External FERPA penetration test and data-silo audit (third-party firm)
- Data Processing Agreement (DPA) template finalized for school contracts
- Teacher account type: teacher creates account, links to a school domain
- Teacher can invite students via class code (students still go through standard onboarding including parental consent)
- Teacher dashboard shows: class-wide mastery heatmap by AP unit (aggregated, anonymous — minimum 5 students per cell before data is shown)
- Teacher dashboard does NOT show: individual student grades, GPA, or session content
- FERPA audit documentation published internally and available to schools on request

**Definition of Done:** FERPA audit report received and all critical findings remediated. Teacher dashboard shows class-wide aggregate data without revealing any individual student's information.

---

**Sprint 29 — Weeks 57–58: Clever SSO + School Onboarding**

Deliverables:
- Clever SSO integration: students and teachers at partner schools can sign in with school credentials
- ClassLink SSO integration
- School admin dashboard: district admin can see school-level aggregate data (not class-level, not student-level)
- School license billing: annual per-student pricing, invoiced annually
- School onboarding documentation: IT setup guide, teacher training materials, parent communication template

---

**Sprint 30 — Weeks 59–60: Phase 4 QA + 24-Month Retrospective**

Deliverables:
- Full regression QA on SmartPack and teacher flows
- 24-month OKR retrospective: what did we hit, what did we miss, why
- Product risk register re-evaluated (Section 9)
- Phase 5 plan reviewed and updated based on actual user data
- Public-facing case study: outcome data from Phase 1–3 cohorts (with student/parent consent)

---

## 9. Risk Register

| Risk | Likelihood | Impact | Specific Mitigation | Owner |
|---|---|---|---|---|
| **LMS ToS violation via extension** | High | Critical | DOM-only read, no token extraction, legal sign-off required before Sprint 15 ships. If legal review fails, launch with manual entry only. | Legal + Engineering |
| **College Board content copyright** | Medium | Critical | Clean-room content creation only. SMEs write original questions from scratch — no released question is used as a direct template, even as a starting point. CEDs used for structural reference only (units, skills, point distribution). Legal counsel reviews the content creation process and guidelines in Sprint 1 before any content is written. All SME contractors sign a content creation agreement explicitly prohibiting use of released materials as templates. AI-generated question variants are not used in production without full SME rewrite — AI can draft, SME must rewrite from scratch before any question goes live. If College Board issues a cease-and-desist at any point, FRQ grading (which grades student-written responses against public rubrics) is the legally safer product surface and continues; original practice question delivery is the exposure point and pauses pending legal review. | Legal + Content |
| **AI grading quality below student trust threshold** | High | High | Three-tier human review model (see Section 7). Tier 1: pre-launch content audit by AP-certified SMEs before any subject's FRQ grader goes live — hard gate, not a suggestion. Tier 2: 2% random weekly sample audit by SME contractors, with automatic pause trigger if agreement rate drops below 65% in any subject. Tier 3: student-triggered dispute review within 24 hours. AI confidence scores are NOT used as the primary quality signal — they catch confused AI but not confidently wrong AI. Systematic errors are caught by the weekly sample audit. | Product + Content |
| **FERPA non-compliance** | Medium | Critical | Legal review in Sprint 1. Privacy policy lawyer-drafted. Parental consent gate before any student data is stored. FERPA audit in Sprint 28. | Legal |
| **High AI cost at scale** | High | Medium | Cost per student tracked from Month 1. Model routing: Groq for low-stakes responses, GPT-4o only where quality requires it. Redis caching reduces repeat AI calls. Target: <$2/student/month by Month 12. | Engineering |
| **Scope creep killing execution** | High | High | Phase gates are enforced. Features not in the current phase sprint plan go to backlog, not active sprint. PM has veto on mid-sprint scope additions. | Product |
| **Low retention outside AP season** | Medium | High | GradeGuard is the retention anchor. Phase 2 must launch by Month 7. If 30-day retention is below 35% at Month 6, Phase 2 launch is accelerated. | Product |
| **Student trust / data privacy breach** | Low | Critical | Row-level security from Sprint 1. No third-party data selling — ever. Annual security audit from Phase 3 onward. | Engineering + Legal |
| **Squad features create toxic comparison** | Medium | Medium | Leaderboards are opt-in. Squad heatmap shows subject mastery, never GPA or individual scores. Burnout flag shown to students on extended streaks. | Product + Design |
| **College Board partnership pursued as a strategy** | Certain (if pursued) | Medium | Do not plan around it. They have one digital partner (Khan Academy) and have resisted third-party prep companies for decades. Treat any partnership as pure upside. | Founders |

---

## 10. What We Are Not Building (And Why)

| Feature | Which Doc | Why Not |
|---|---|---|
| **Group Pomodoro timers (WebRTC)** | v14.0 | Requires coordinated real-time sessions between friends. Teen schedules don't support this. Low adoption ceiling, high engineering cost. |
| **Feynman teach-back as a core daily mechanic** | v14.0 | Works for motivated self-directed learners (~10% of the target market). As an optional StudySensei feature, acceptable. As a daily loop, it will kill retention for the other 90%. |
| **Voice-native Socratic tutor as primary interface** | v14.0 | Most students study in shared spaces. Voice-first requires privacy and comfort with AI conversation. Text-first with optional voice is realistic. Validate demand in Phase 3 data before building. |
| **School-wide efficiency leaderboards** | v14.0 | Creates toxic comparison culture. Legal exposure in some states. Squad leaderboards (opt-in, small group) are the safe version. |
| **International expansion (LATAM, East Asia) before Month 24** | v4.1 | Do not plan international expansion before proving product-market fit in California. Revisit at Month 24 retrospective if data supports it. |
| **College Board partnership** | v4.1 | Not realistic in the near term. Stop putting it in planning documents. |
| **AceOS API (B2B Platform)** | v4.1 | Premature. Building a platform API before the core product is stable creates maintenance burden without revenue. Revisit post-Month 30. |
| **Native iOS/Android apps** | v4.1 | PWA is sufficient through Month 24. Native apps add significant engineering overhead. Build when 40%+ of users are on mobile and PWA limitations become a measurable retention problem. |

---

## 11. KPI Dashboard

| Metric | Month 3 | Month 6 | Month 12 | Month 18 | Month 24 |
|---|---|---|---|---|---|
| **MRR** | $5K | $20K | $100K | $200K | $400K |
| **Active Students** | 500 | 2,000 | 8,000 | 18,000 | 40,000 |
| **AP Subjects Covered** | 6 | 8 | 14 | 20 | 20+ |
| **7-Day Retention** | 40% | 45% | 58% | 65% | 70% |
| **30-Day Retention** | 25% | 32% | 48% | 58% | 65% |
| **NPS** | ≥40 | ≥50 | ≥58 | ≥63 | ≥67 |
| **Avg Session Frequency** | 2.5x/wk | 3x/wk | 4x/wk | 4.5x/wk | 5x/wk |
| **FRQs Graded (cumulative)** | 500 | 5,000 | 50,000 | 200,000 | 700,000 |
| **Parent Accounts Linked** | 0 | 200 | 2,000 | 6,000 | 15,000 |
| **Annual Plan %** | 5% | 12% | 22% | 30% | 35% |
| **Monthly Churn** | 12% | 10% | 8% | 7% | 6% |
| **School Licenses** | 0 | 0 | 0 | 2 pilots | 5 contracts |
| **AI Cost/Active Student/mo** | <$3.00 | <$2.50 | <$2.00 | <$1.80 | <$1.50 |

**KPI notes:**
- Month 3 MRR target of $5K is approximately 100 Sprint Pack purchases at $49 — achievable with a focused AP subreddit and teacher partnership launch.
- If monthly churn exceeds 15% at Month 6, pause growth spending and fix retention before acquisition. A leaky product gets worse, not better, with more users.
- AI cost per student must be monitored from Month 1. If it exceeds $4/student/month at a $19.99 Pro price point, unit economics do not work at scale without model optimization.
- Parent account linking is a leading indicator of long-term retention and referral. Track it from Phase 2 launch.

---

## 12. Master Timeline Summary

| Phase | Months | Sprints | Theme | Key Milestone |
|---|---|---|---|---|
| **Phase 1: ScoreBoost AP** | 1–6 | 1–12 | Win AP season | 8 subjects live · FRQ grader · $20K MRR · NPS ≥50 |
| **Phase 2: GradeGuard** | 7–12 | 13–18 | Year-round retention | GPA tracker + What-If + parent dashboard · $100K MRR · 30-day retention ≥48% |
| **Phase 3: StudySensei** | 13–18 | 19–24 | Stuck → unstuck in-app | Text tutoring + AP Spanish · 20 subjects · $200K MRR |
| **Phase 4: SmartPack + Schools** | 19–24 | 25–30 | Social retention + B2B | Squads · Teacher dashboard · FERPA audit · $400K MRR |

---

*AceOS v1.0 Product Roadmap | April 2026 | Internal Working Document — Not for External Distribution*  
*Next scheduled review: Month 3 OKR check-in | Document Owner: Product*
