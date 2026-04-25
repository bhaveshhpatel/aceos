# AceOS™ — Master Product Roadmap
### *"Study Smarter, Not Harder"*
**Version 3.0 | Refined & Finalized | April 2026**

---

## 📌 North Star & Strategic Foundation

**North Star Metric:** Number of students who improve their GPA by ≥0.3 points OR score a 4/5 on an AP exam after 90 days of active use.

**Mission:** Build the operating system for every high school student's academic life — unifying daily grade performance, AP exam mastery, AI tutoring, and social accountability into one intelligent, adaptive platform.

**The Core Belief:** Students don't fail because they're lazy. They fail because they don't have a *system*. AceOS is the system.

---

## 🌍 Market Reality Check

| Signal | Data Point |
|---|---|
| Smart Learning Market (2025) | $80.69B → $178.62B by 2030 at 17.2% CAGR |
| California K-12 Enrollment (2025–26) | ~9.9 million students |
| California HS Students (Gr. 9–12 est.) | ~1.85 million |
| AP Exams 2026 Window | May 4–15 with late window May 18–22 |
| AP Exams Going Fully Digital | Bluebook™ hybrid format live now |
| #1 Study Technique (evidence-based) | Spaced Repetition using FSRS algorithm — 20–30% fewer reviews than older SM-2 for same retention |
| Personalized Learning Gap | 78% of edtech publishers struggle to scale AI personalization |
| California HS Enrollment Trend | Declining 1.3%/year — focus on quality of engagement over raw volume |

**The Opportunity Gap:** No single product today unifies daily GPA maintenance + AP exam mastery + AI Socratic tutoring + social accountability under one adaptive student intelligence profile. That gap is the entire AceOS thesis.

---

## 🏗️ Suite Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AceIt Dashboard                   │  ← The Front Door
├──────────────┬──────────────┬──────────┬────────────┤
│  GradeGuard  │ ScoreBoost AP│StudySensei│ SmartPack  │  ← 4 Core Modules
├──────────────┴──────────────┴──────────┴────────────┤
│          Student Intelligence Profile (SIP)          │  ← Shared AI Brain
│     (Learning style · Weak concepts · GPA arc ·     │
│      AP score projection · Burnout risk index)       │
├─────────────────────────────────────────────────────┤
│              Shared Data & Auth Layer                │  ← Supabase + PostgreSQL
└─────────────────────────────────────────────────────┘
```

### How the Products Talk to Each Other

- **GradeGuard → ScoreBoost AP:** When GradeGuard detects struggling with stoichiometry in AP Chem class, it automatically flags this in ScoreBoost AP so that unit gets prioritized in the AP prep plan.
- **StudySensei → GradeGuard:** When the AI tutor identifies a conceptual gap in integration by parts, GradeGuard schedules a 10-minute micro-review 2 days before the next Calc quiz.
- **SmartPack → All:** Squad members' collective performance data surfaces the most commonly missed concepts across the group.
- **All → Student Intelligence Profile:** Every interaction, quiz, session, and essay refines the AI's model of the student, making every recommendation sharper over time.

---

## 📦 Suite Packaging & Pricing Strategy

| Tier | What's Included | Price | Target Buyer |
|---|---|---|---|
| **Free (Starter)** | GradeGuard (1 subject), ScoreBoost AP diagnostic only | $0 | Student/organic |
| **Student Pro** | All 4 modules, full AI features | $24.99/mo or $179/yr | Parent/student |
| **Family Plan** | Student Pro for up to 3 kids | $34.99/mo or $249/yr | Parents |
| **School License** | All modules for all students, teacher dashboards | $8/student/mo | Schools/districts |
| **AP Sprint Pack** | ScoreBoost AP + StudySensei, 90-day AP season only | $59 one-time | Late-stage AP prep |

---

## 🗓️ PHASE 1: Beachhead (Months 1–6)
### Build ScoreBoost AP — Own the AP 5 Market

**Strategic Logic:** AP exam season is May 4–15 every year. Students are most desperate, most willing to pay, and most likely to evangelize if they score a 5. Most popular AP courses to prioritize first: **AP Calc AB/BC, AP Bio, AP Chem, AP US History, AP Lang, AP Psych** — the 6 most taken exams nationally.

---

### Phase 1 OKRs

**Objective 1:** Launch a product that meaningfully improves AP scores before May 2027 exams.
- KR1: 500 students complete a full AP diagnostic within 60 days of launch
- KR2: 70% of active users show measurable improvement (≥10% score gain) on practice tests after 4 weeks
- KR3: Average predicted AP score improves from 2.8 → 3.6 for active users by Week 8

**Objective 2:** Validate willingness to pay before building further.
- KR1: $5,000 MRR by Month 3
- KR2: $20,000 MRR by Month 6
- KR3: Net Promoter Score ≥ 55 by end of Phase 1

**Objective 3:** Establish the Student Intelligence Profile (SIP) data foundation.
- KR1: Collect ≥ 10,000 diagnostic question responses to train SIP model
- KR2: SIP accuracy validated — predicted vs. actual practice test score within ±0.4 points for 75% of users

---

### Phase 1 Epics & Feature Breakdown

#### 🔷 Epic 1.1 — AP Diagnostic Engine (Sprint 1–3 | Weeks 1–6)

| Feature | Description | Priority |
|---|---|---|
| **Subject Selector** | Student picks their AP subject(s); supports top 6 at launch | P0 |
| **50-Question Diagnostic** | College Board-aligned questions covering all units; calibrated difficulty curve | P0 |
| **Unit Heatmap** | Visual grid of all AP units colored Green/Yellow/Red based on diagnostic performance | P0 |
| **Predicted Score (1–5)** | Immediate post-diagnostic score prediction using weighted performance model | P0 |
| **Personalized Study Plan** | Auto-generated week-by-week plan from today → 2 weeks before AP exam | P0 |
| **"Where Are You" Benchmark** | Shows percentile rank vs. other AceOS users on same diagnostic | P1 |
| **Multi-Subject Dashboard** | Student can track 2+ AP subjects simultaneously | P1 |

**Acceptance Criteria for Epic 1.1:** A student completes diagnostic → sees heatmap + predicted score + 8-week plan within 3 minutes of finishing. No dead ends. No manual setup.

---

#### 🔷 Epic 1.2 — Adaptive Practice Engine with FSRS Spaced Repetition (Sprint 3–6 | Weeks 5–12)

Spaced repetition using the **FSRS algorithm** is the gold standard — it produces 20–30% better retention per study hour than older SM-2 approaches. This is not flashcards — it's an intelligent question-delivery engine.

| Feature | Description | Priority |
|---|---|---|
| **FSRS Adaptive Quiz Engine** | Questions scheduled at optimal intervals (1d → 3d → 1wk → 2wk) based on recall accuracy | P0 |
| **Concept-Level Tagging** | Every question tagged to specific AP unit + College Board learning objective | P0 |
| **"Why Wrong?" Explainer** | After incorrect answer: AI explains the concept from first principles using Socratic stepping | P0 |
| **Daily Review Queue** | Each morning: "You have 12 cards due today across Calc AB and APUSH" | P0 |
| **Performance Streak** | Daily study streak tracker with science-backed nudges | P1 |
| **Weak Concept Drill Mode** | On-demand rapid-fire session targeting only Red-zone units | P1 |
| **Progress vs. Score Projection** | Live graph: "Based on this week's performance, your projected score moved from 3 → 3.4" | P1 |
| **Interleaving Mode** | Mixed-subject sessions switching between topics every 5 questions — proven to improve long-term retention 23% over blocked study | P2 |

**Key Technical Note:** FSRS (Free Spaced Repetition Scheduler) is open-source and research-validated. Implement the FSRS-5 variant for maximum accuracy.

---

#### 🔷 Epic 1.3 — FRQ / DBQ AI Grader (Sprint 5–8 | Weeks 9–16)

This is the **single biggest market gap** in AP prep. Every student fears the free-response section.

| Feature | Description | Priority |
|---|---|---|
| **FRQ Submission Portal** | Student types or uploads handwritten FRQ response per AP subject | P0 |
| **Rubric-Aligned AI Scoring** | AI scores response against exact College Board rubric (AP History DBQ/LEQ, AP Science FRQ, AP Calc FRQ, AP Lang synthesis essay) | P0 |
| **Line-by-Line Feedback** | Specific, actionable feedback per rubric point | P0 |
| **Model Response** | After student submits and reviews feedback, show a high-scoring model response with annotations | P0 |
| **Revision Loop** | Student revises and resubmits for a second score — tracks improvement | P1 |
| **FRQ Score History** | Timeline of FRQ scores per subject — shows improvement arc | P1 |
| **AP-Specific Prompt Library** | 200+ past AP FRQ prompts (CBQ, DBQ, LEQ, Lab FRQ) catalogued by year and unit | P1 |
| **Voice Dictation Option** | Student speaks their response; AI transcribes and grades | P2 |

**AI Implementation Note:** Use GPT-4o or Claude 3.7 as the grading backbone with a rubric injection system prompt per subject. Fine-tune on College Board sample responses (public domain) to calibrate scoring accuracy.

---

#### 🔷 Epic 1.4 — Bluebook™ Digital Exam Simulator (Sprint 7–9 | Weeks 13–18)

AP exams are now fully/hybrid digital via Bluebook. No competitor has built a proper Bluebook-style interface. This is a 6-month first-mover window.

| Feature | Description | Priority |
|---|---|---|
| **Full-Length Timed Practice Exam** | 3-hour+ timed exam in Bluebook-style UI (split screen for FRQ, annotation tools, timer) | P0 |
| **Section Breakdown** | MCQ section → FRQ section with exact timing per AP exam specifications | P0 |
| **Digital Annotation Tools** | Highlight, strikethrough, flag for review — same tools as real Bluebook | P0 |
| **Distraction-Free Mode** | Full-screen lock mode to simulate real exam environment | P1 |
| **Post-Exam Report** | Full score breakdown by unit after exam completion; weak areas flagged into study plan | P0 |
| **Retake Scheduler** | System automatically schedules next full-length exam 2 weeks later with fresh question set | P1 |
| **Score Trend Graph** | Full-exam scores plotted over time — visual progress toward a 5 | P1 |

---

#### 🔷 Epic 1.5 — Onboarding, Auth & Core Infrastructure (Sprint 1–2 | Weeks 1–4)

| Feature | Description | Priority |
|---|---|---|
| **Student Onboarding Flow** | Grade level → AP subjects → exam date → diagnostic trigger — 5 minutes max | P0 |
| **Parent Onboarding** | Optional parent account link — weekly email summary of student progress | P1 |
| **Google/Apple SSO** | Frictionless auth — no email/password barriers | P0 |
| **Subscription & Paywall** | Free tier (1 subject, 1 diagnostic, 20 practice questions) → Pro upgrade | P0 |
| **Student Intelligence Profile v0.1** | Initial SIP seed from diagnostic data — stores learning pace, weak units, predicted score | P0 |

---

### Phase 1 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable |
|---|---|---|---|
| Sprint 1 | 1–2 | Auth, DB schema, onboarding flow | Working login + subject selector |
| Sprint 2 | 3–4 | Diagnostic engine + Unit Heatmap | 50Q diagnostic live for AP Calc AB |
| Sprint 3 | 5–6 | Score predictor + Study plan generator | Personalized 8-week plan output |
| Sprint 4 | 7–8 | FSRS engine + Daily review queue | Adaptive quiz system live |
| Sprint 5 | 9–10 | "Why Wrong?" explainer + Weak drill mode | Full practice loop complete |
| Sprint 6 | 11–12 | FRQ grader MVP (AP Calc + APUSH) | First AI-graded FRQ submissions |
| Sprint 7 | 13–14 | Bluebook simulator MCQ section | Timed digital exam (MCQ only) |
| Sprint 8 | 15–16 | Bluebook simulator FRQ section | Full exam simulator live |
| Sprint 9 | 17–18 | Payment flow, free/pro tiers, parent dashboard | Monetization live |
| Sprint 10 | 19–20 | Remaining 4 AP subjects, bug fixes, polish | 6 AP subjects fully supported |
| Sprint 11 | 21–22 | Performance optimization + user testing | Load-tested, UAT complete |
| Sprint 12 | 23–24 | Soft launch (California only) | 🚀 Public launch Month 6 |

---

### Phase 1 — Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + TypeScript | SSR for SEO, rapid component dev |
| **Backend/API** | Next.js API Routes + Python FastAPI (AI services) | FastAPI for AI microservices; Next.js for CRUD |
| **Database** | Supabase (PostgreSQL) | Auth + DB + realtime in one |
| **AI/LLM** | OpenAI GPT-4o + Claude 3.7 Sonnet via API | GPT-4o for FRQ grading; Claude for Socratic tutoring |
| **FSRS Engine** | `ts-fsrs` (TypeScript open-source library) | Drop-in FSRS-5 implementation |
| **Hosting** | Vercel (frontend) + Railway (Python AI services) | Existing infra; zero new learning curve |
| **Payments** | Stripe | Industry standard; subscription + one-time support |
| **Email** | Resend + React Email | Parent summaries, streak nudges |
| **Analytics** | PostHog (self-hostable) | Product analytics without vendor lock-in |
| **CDN / Media** | Cloudflare R2 | FRQ image uploads, student-uploaded notes |
| **Search** | Postgres Full-Text Search → pgvector | Semantic question search + concept tagging |
| **AI Embeddings** | OpenAI `text-embedding-3-small` + pgvector | Semantic similarity for concept clustering in SIP |

---

### Phase 1 — Team Needed

| Role | Headcount | Notes |
|---|---|---|
| Full-Stack Dev | 1 | Next.js + Supabase |
| AI/ML Engineer | 1 | Python FastAPI, LLM prompt engineering, FSRS |
| Content Lead (AP Expert) | 1 | Write/curate 2,000+ AP questions, FRQ prompts, rubrics |
| Product Designer (UI/UX) | 1 (part-time/contractor) | Figma → production |
| AP Content Reviewers | 2–3 (contract) | Subject-matter experts per AP subject |

---

### Phase 1 — Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| College Board copyright on past exam questions | High | High | Use only College Board released free-response and publicly available practice materials; generate original questions using AP framework |
| AI FRQ grading accuracy too low for trust | Medium | High | Human-in-the-loop review for first 1,000 submissions; display confidence score; allow student to flag |
| Low initial traction without marketing budget | Medium | High | Launch in California Facebook parent groups + Reddit r/APStudents; son's school = first 50 users |
| Student churn after AP exam season ends | High | Medium | Phase 2 GradeGuard launch is the direct answer; time Phase 2 to start August back-to-school |
| OpenAI API cost at scale | Medium | Medium | Aggressive caching of repeated FRQ rubric prompts; rate-limit free tier |

---

## 🗓️ PHASE 2: Retention Engine (Months 7–12)
### Build GradeGuard — Own the Daily A

**Strategic Logic:** After May AP exams, ScoreBoost AP has no reason to exist until next spring. GradeGuard launches in August (back-to-school) and gives every student a reason to stay year-round. This is the **LTV multiplier**.

---

### Phase 2 OKRs

**Objective 1:** Retain AP-season users through the school year.
- KR1: 60% of Phase 1 paid users convert to an annual plan by September
- KR2: DAU/MAU ratio reaches ≥ 35% by Month 10
- KR3: Average session length ≥ 18 minutes/day for active users

**Objective 2:** Acquire net new users through back-to-school momentum.
- KR1: 2,000 new signups in first 2 weeks of September
- KR2: $40,000 MRR by Month 12
- KR3: Referral rate — 1 in 4 new users came from a peer recommendation

**Objective 3:** Strengthen Student Intelligence Profile with daily behavioral data.
- KR1: SIP can predict quiz performance with ≥80% accuracy by Month 12
- KR2: Personalized study plan recommendations accepted (not skipped) by ≥65% of users

---

### Phase 2 Epics & Feature Breakdown

#### 🔷 Epic 2.1 — Assignment Intelligence Hub (Sprint 13–15)

| Feature | Description | Priority |
|---|---|---|
| **Assignment Inbox** | Student adds assignments, tests, projects with due dates and grade weight | P0 |
| **AI Priority Ranker** | Ranks today's study priorities by: days until due × grade weight × current mastery gap | P0 |
| **Grade Weight Calculator** | Student inputs course grading breakdown; GradeGuard tracks weighted GPA in real time | P0 |
| **"What's On The Test?" Predictor** | Based on teacher-uploaded syllabus + unit, AI generates top 10 most likely test concepts | P1 |
| **Missing Assignment Alert** | Flags overdue assignments before they become 0s | P0 |
| **Upcoming Week View** | Calendar view of all subjects' workload for the next 7 days | P1 |
| **Teacher Syllabus Upload** | PDF/image upload of teacher syllabus → AI extracts key dates and topics automatically | P1 |

---

#### 🔷 Epic 2.2 — Grade Simulator & GPA Tracker (Sprint 15–16)

| Feature | Description | Priority |
|---|---|---|
| **Live GPA Dashboard** | Current GPA across all subjects, updated as student logs grades | P0 |
| **"What If" Grade Simulator** | "If I get 88 on the next test and skip the extra credit, what's my semester grade?" | P0 |
| **A-Guard Alert** | Notifies when a grade is within 3 points of dropping below an A | P0 |
| **Semester Arc Chart** | Visualizes grade trajectory over the semester | P1 |
| **California A-G Requirement Tracker** | Maps current courses to UC/CSU A-G requirements — critical for California college apps | P1 |
| **Teacher Grade Export** | Student can log grades manually or connect Google Classroom for auto-import | P2 |

---

#### 🔷 Epic 2.3 — Essay & Writing Coach (Sprint 16–18)

| Feature | Description | Priority |
|---|---|---|
| **Essay Draft Analyzer** | Student submits essay draft; AI evaluates thesis strength, argument structure, evidence quality, conclusion | P0 |
| **AP Writing Style Mode** | Calibrated for AP Lang synthesis essays, AP Lit literary analysis, AP History LEQ/DBQ | P0 |
| **Revision Tracker** | Upload Draft 1 → Draft 2 → Draft 3; AI shows improvement delta per rubric dimension | P1 |
| **Citation Checker** | Flags unsupported claims; suggests where evidence is needed | P1 |
| **Tone & Voice Feedback** | Identifies passive voice, weak verbs, unclear transitions — college-prep level feedback | P1 |

---

#### 🔷 Epic 2.4 — Micro-Study Streaks & Habit Engine (Sprint 17–18)

| Feature | Description | Priority |
|---|---|---|
| **Daily 10-Minute Review** | Every morning: 5 spaced-rep questions + 5 new questions, optimally scheduled by SIP | P0 |
| **Study Streak** | Streak counter with scientifically-worded encouragement (not guilt-tripping) | P0 |
| **Weekly Study Report** | Sunday evening: "This week you studied 4.2 hrs, reviewed 87 concepts, GPA is on track for 3.9" | P0 |
| **Burnout Risk Indicator** | SIP monitors study load; warns when pattern suggests cognitive overload | P1 |
| **Optimal Study Time Nudge** | Learns when a student is most likely to study and nudges at that time | P1 |
| **"Quick Win" Mode** | When student opens app with only 5 minutes: auto-serves the 3 most urgent review cards | P1 |

---

#### 🔷 Epic 2.5 — AceIt Dashboard v1.0 (Sprint 19–20)

| Feature | Description | Priority |
|---|---|---|
| **Unified Home Screen** | One dashboard: Today's priority (GradeGuard), Days to AP exam (ScoreBoost), Recent AI session | P0 |
| **Cross-Module SIP Alerts** | "Your GradeGuard shows you're weak in stoichiometry — ScoreBoost AP has queued a drill for you" | P0 |
| **Single Login, All Modules** | One account governs GradeGuard + ScoreBoost AP; seamless switching | P0 |
| **Progress Snapshot** | Weekly one-screen summary: GPA, AP score projection, streaks, sessions completed | P0 |

---

### Phase 2 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable |
|---|---|---|---|
| Sprint 13 | 1–2 | Assignment Inbox + priority ranker | GradeGuard MVP live |
| Sprint 14 | 3–4 | Grade simulator + A-Guard alert | GPA tracking live |
| Sprint 15 | 5–6 | A-G tracker + teacher syllabus upload | California curriculum alignment |
| Sprint 16 | 7–8 | Essay coach MVP (AP Lang + AP Lit) | Writing feedback live |
| Sprint 17 | 9–10 | Daily review engine + streak system | Habit loop live |
| Sprint 18 | 11–12 | Burnout risk + optimal nudge timing | Behavioral intelligence v1 |
| Sprint 19 | 13–14 | AceIt Dashboard v1.0 | Unified home screen |
| Sprint 20 | 15–16 | Cross-module SIP alerts | Intelligence profile cross-pollination |
| Sprint 21 | 17–18 | Scale testing + performance tuning | 10,000 concurrent users tested |
| Sprint 22 | 19–20 | Back-to-school GTM push | 🚀 GradeGuard public launch (August) |
| Sprint 23 | 21–22 | Family Plan billing + sibling accounts | Revenue tier expansion |
| Sprint 24 | 23–24 | Phase 2 retrospective + Phase 3 design | Design sprint for StudySensei |

---

## 🗓️ PHASE 3: Differentiation Moat (Months 13–18)
### Build StudySensei — The AI Socratic Tutor That Schools Trust

**Strategic Logic:** StudySensei transforms AceOS from a "study app" into an **AI tutoring platform** — which unlocks B2B school sales. Schools won't pay for flashcards. They will pay for a product that demonstrably improves student understanding AND doesn't do their homework for them.

---

### Phase 3 OKRs

**Objective 1:** Launch AI tutoring that is measurably better than passive watching/reading.
- KR1: 80% of students who use StudySensei for a concept score higher on their next quiz on that concept vs. baseline
- KR2: Average student conceptual mastery improves 22% faster for StudySensei users vs. non-users
- KR3: 500 Socratic tutoring sessions completed in first 30 days

**Objective 2:** Begin B2B school sales pipeline.
- KR1: 5 California high schools sign letters of intent for school licensing by Month 18
- KR2: First $10,000 in B2B ARR by Month 18
- KR3: 3 teachers publicly endorse AceOS in testimonials/case studies

**Objective 3:** Increase platform stickiness to ≥3 modules per active user.
- KR1: 45% of active users use 3+ modules in the same week
- KR2: Churn rate drops from Phase 2 baseline to ≤5% monthly

---

### Phase 3 Epics & Feature Breakdown

#### 🔷 Epic 3.1 — Socratic AI Tutor Core (Sprint 25–28)

The **cardinal rule:** StudySensei never gives the answer. It asks the question that leads the student to find it.

| Feature | Description | Priority |
|---|---|---|
| **Subject-Specific AI Persona** | Separate AI tutor personalities calibrated per subject | P0 |
| **Concept Entry Point** | Student types "I don't understand integration by parts" → Sensei starts Socratic dialogue | P0 |
| **Guided Step Decomposition** | AI breaks problem into micro-steps; asks guiding question at each step | P0 |
| **"Never Just Answer" Guardrail** | Hard product rule: AI never outputs a direct answer to a homework problem | P0 |
| **Concept Web Auto-Generator** | After each session, AI auto-creates a visual concept map showing connections to related topics | P1 |
| **Session Summary** | End of each tutoring session: 3-bullet summary of what was learned + 1 concept to review tomorrow | P0 |
| **Problem Upload** | Student photographs or screenshots a problem; AI parses it and begins Socratic walkthrough | P1 |
| **Voice Mode** | Talk to Sensei; speak explanations aloud (verbal explanation increases retention ~40%) | P2 |

---

#### 🔷 Epic 3.2 — "Teach It Back" Mastery Mode (Sprint 27–29)

Based on the Feynman Technique — if you can explain it simply, you understand it.

| Feature | Description | Priority |
|---|---|---|
| **Explain-Back Prompt** | After learning a concept, Sensei says: "Now explain mitosis to me as if I'm a 10-year-old" | P0 |
| **AI Explanation Evaluator** | AI evaluates quality of explanation: accuracy, completeness, clarity, use of examples | P0 |
| **Mastery Badge** | Once student explains a concept correctly back: concept moves to Green in SIP heatmap | P0 |
| **"Gaps in Your Explanation" Feedback** | Pinpoints exactly which part of the explanation was missing or incorrect | P1 |
| **Concept Mastery History** | Timeline of all concepts mastered via teach-back — visible win streaks | P1 |

---

#### 🔷 Epic 3.3 — California Curriculum Alignment Engine (Sprint 28–30)

This is the **school sales unlock**.

| Feature | Description | Priority |
|---|---|---|
| **CA Common Core Standards Tagging** | Every concept, question, and session tagged to California Common Core + NGSS standards | P0 |
| **AP College Board Framework Mapping** | All content maps to College Board AP Course and Exam Descriptions (CEDs) | P0 |
| **A-G Course Alignment** | Content maps to UC/CSU A-G requirements — critical for California college readiness | P0 |
| **Teacher Dashboard (B2B MVP)** | Teacher view: class roster progress, concepts most students struggle with, weekly engagement | P1 |
| **Class Assignment Mode** | Teacher assigns "Concept: Cellular Respiration" → all students get a Sensei session on it | P1 |

---

#### 🔷 Epic 3.4 — B2B School Licensing Infrastructure (Sprint 30–32)

| Feature | Description | Priority |
|---|---|---|
| **School Admin Portal** | District/school admin onboards teachers and students in bulk via CSV or Clever SSO | P0 |
| **Student Roster Management** | Admin view of all students, usage rates, at-risk flags | P0 |
| **Parent Consent Flow (COPPA/FERPA)** | Compliant consent workflow for students under 18 | P0 |
| **Usage Reports (PDF export)** | Monthly report principal can share with board | P1 |
| **Classroom License Billing** | Per-student monthly billing managed at the school level; annual contract option | P0 |
| **Clever/Classlink SSO** | One-click school SSO integration — biggest friction reducer for IT approval | P1 |

---

## 🗓️ PHASE 4: Viral Growth Engine (Months 19–24)
### Build SmartPack — Social Studying That Spreads

**Strategic Logic:** By Month 19, AceOS has a proven, engaged user base. SmartPack adds the **social layer** that turns every student into a distribution channel. One student brings their entire friend group.

---

### Phase 4 OKRs

**Objective 1:** Create a viral growth loop driven by social studying.
- KR1: K-factor (viral coefficient) ≥ 0.5 — every 2 users brings 1 new user
- KR2: 30% of new signups in Month 22–24 come from SmartPack squad invites
- KR3: Average squad study session length ≥ 25 minutes

**Objective 2:** Increase platform MAU by 3x from Phase 3 baseline.
- KR1: 50,000 MAU by end of Month 24
- KR2: $100,000 MRR by Month 24
- KR3: Expand beyond California to 3 additional states (Texas, New York, Florida)

---

### Phase 4 Epics & Feature Breakdown

#### 🔷 Epic 4.1 — Study Squads (Sprint 33–36)

| Feature | Description | Priority |
|---|---|---|
| **Squad Creation** | Create or join a squad of 2–6 students; name it, pick AP subjects | P0 |
| **Live Quiz Battles** | Real-time competitive quizzing on AP content; live leaderboard during session | P0 |
| **Shared Concept Heatmap** | Squad-level view: which concepts does the whole group struggle with? | P0 |
| **Structured Study Session Roles** | Rotating roles: Quizmaster, Explainer, Timer, Challenger | P1 |
| **Session Scheduler** | "Squad AP Bio session — Thursday 7pm — 45 mins" with RSVP and reminder | P1 |
| **Group FRQ Review** | Squad reviews each other's FRQ responses with guided AI facilitation | P2 |

---

#### 🔷 Epic 4.2 — Gamification & Leaderboards (Sprint 35–37)

| Feature | Description | Priority |
|---|---|---|
| **XP System** | Earn XP for daily reviews, Teach-Back mastery, FRQ submissions, squad sessions | P0 |
| **School Leaderboard** | Anonymous AP readiness ranking per school — "Your school ranks #3 in AP Bio readiness in California" | P1 |
| **Subject Badges** | Earn "AP Calc Master," "DBQ Legend," "Streak Scholar" badges that show on profile | P1 |
| **Weekly Challenge** | School-wide or national 7-day challenge | P1 |
| **Reward Unlocks** | Streaks + XP unlock premium practice sets and bonus content | P1 |

---

#### 🔷 Epic 4.3 — Note Library & Community Content (Sprint 37–39)

| Feature | Description | Priority |
|---|---|---|
| **Shared Note Upload** | Students upload their best study guides and notes per AP subject | P1 |
| **Peer Rating System** | Community rates note quality; top notes surface first | P1 |
| **Contributor Reputation Score** | Top note contributors get premium features unlocked | P1 |
| **AI Note Quality Check** | Before publishing, AI checks note for accuracy against AP curriculum | P1 |
| **"Best Notes This Week"** | Weekly curated digest of top-rated student notes per subject | P2 |

---

## 🗓️ PHASE 5: The Full Platform (Month 24+)
### Unify as AceOS™ — National Scale

**Goals:**
- Full AceIt Dashboard v2.0 — all four modules unified with mature SIP intelligence
- Expand to 40+ AP subjects (from 6 at launch)
- Launch iOS + Android native apps (React Native migration)
- Achieve 5 state school district contracts
- Target: **$1M ARR** run rate by Month 30
- SAT/ACT prep module expansion (adjacent market, same customer)
- Raise seed round based on retention metrics and outcome data

---

## 💰 Full Monetization Model

| Tier | Price | Includes | Target |
|---|---|---|---|
| **Free (Starter)** | $0 | 1 AP subject, 1 diagnostic, 20 practice Qs/mo | Acquisition |
| **Student Pro** | $24.99/mo or $179/yr | All 4 modules, unlimited subjects, FRQ grading | Core B2C |
| **Family Plan** | $34.99/mo or $249/yr | Student Pro for up to 3 students | Parents |
| **AP Sprint Pack** | $59 one-time | ScoreBoost AP + StudySensei for 90 days | February–April urgency buy |
| **School License** | $8/student/mo | All modules, teacher dashboards, admin portal, Clever SSO | B2B |
| **District Contract** | Custom (≈$50K–$200K/yr) | Full district deployment, dedicated CSM, outcome reports | Enterprise B2B |

### Revenue Projection

| Milestone | MRR | Trigger |
|---|---|---|
| Month 3 | $5K | 200 Pro subscribers at $24.99 |
| Month 6 | $20K | 800 subscribers + AP Sprint Pack sales |
| Month 12 | $40K | Back-to-school surge + Family Plans |
| Month 18 | $70K | StudySensei launch + first B2B contracts |
| Month 24 | $100K | SmartPack viral growth + 3-state expansion |
| Month 30 | $200K+ | National scale + district contracts |

---

## 🚀 Go-To-Market Strategy

### GTM Phase 1: Ground Zero — Your Son's School

1. **Week 1:** Give free Pro access to 20 students at your son's school — get real usage data, not survey data
2. **Week 3:** Host a parent info night (or virtual Zoom) at the school
3. **Month 2:** Reddit strategy — post genuine value content in r/APStudents, r/highschool, r/studytips
4. **Month 3:** Reach out to 3 AP teachers directly — offer free classroom access in exchange for feedback

### GTM Phase 2: California Parent Communities

- **Facebook Groups:** "Bay Area High School Parents," "Sacramento Moms," "California AP Parents"
- **Instagram/TikTok Reels:** 30-second clips showing FRQ score going from 3/9 → 8/9 after AI feedback
- **College Counselors:** 5,000+ independent college counselors in California who recommend prep tools

### GTM Phase 3: B2B School Sales

- Start with **charter school networks** — more autonomy, faster decisions
- Target **Title I schools** in California for grant-backed purchases — position as equity tool
- Pilot in 2 schools free for one semester → publish outcomes report → close adjacent schools

---

## 🔐 Compliance & Legal (Non-Negotiable)

| Requirement | Action |
|---|---|
| **COPPA** | Full parental consent flow for users under 13; privacy-by-default for all under-18 users |
| **FERPA** | No sharing of student educational records without consent; required for B2B school contracts |
| **CCPA** | Data deletion on request; privacy policy in plain English |
| **College Board IP** | Use ONLY publicly released free-response questions; generate all original MCQ content |
| **AI Disclosure** | Clear disclosure that FRQ grading is AI-assisted; include accuracy confidence scores |
| **Data Residency** | Store all student data on US-based servers (Supabase US region) |

---

## 📊 Success Metrics Dashboard

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|---|---|---|---|
| DAU/MAU | ≥25% | ≥35% | ≥42% |
| Monthly Churn | ≤10% | ≤7% | ≤5% |
| FRQ Sessions/User/Week | ≥1.5 | ≥2 | ≥2.5 |
| AP Score Improvement (avg) | +0.6 pts | +0.8 pts | +1.0 pts |
| NPS | ≥50 | ≥60 | ≥65 |
| CAC (Customer Acquisition Cost) | ≤$15 | ≤$12 | ≤$8 (school channel) |
| LTV (Annual) | $180 | $250 | $350 |
| LTV:CAC Ratio | 12:1 | 20:1 | 43:1 |

---

## ⚠️ Top 5 Strategic Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Google/Khan Academy builds this** | Speed of execution is your only moat in Year 1; SIP data becomes moat in Year 2 |
| 2 | **AI costs blow up unit economics** | Aggressive prompt caching; free tier rate-limited; model downgrades for simple tasks |
| 3 | **AP exam format changes by College Board** | Subscribe to AP Central updates; build question tagging system for flexibility |
| 4 | **Students use it as a homework cheat tool** | StudySensei's "never give the answer" guardrail is a marketing advantage with parents AND schools |
| 5 | **California enrollment declining (-1.3%/yr)** | Expand to Texas, New York, Florida by Month 24; California is beachhead only |

---

## 🏆 24-Month Journey at a Glance

```
Month 1–6   │ ScoreBoost AP ──────────── 🚀 Launch (CA only)
Month 7–12  │ GradeGuard ────────────── 🚀 Back-to-school launch
Month 13–18 │ StudySensei ───────────── 🚀 Launch + B2B schools
Month 19–24 │ SmartPack ─────────────── 🚀 Social launch + 3 states
Month 24+   │ AceOS Full Platform ───── 🚀 National scale + seed round
             │
             └── SIP AI Brain deepens continuously throughout ────────►
```

---

*AceOS™ — Built to make every high school student study smarter, not harder.*
*Version 3.0 | April 2026*
