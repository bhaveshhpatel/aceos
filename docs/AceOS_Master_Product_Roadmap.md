# AceOS™ — Master Product Roadmap
### *"Study Smarter, Not Harder"*
**Version 4.0 | Full Refinement — Subject-Aware · Pluggable Architecture · i18n Ready | April 2026**

---

## 📌 North Star & Strategic Foundation

**North Star Metric:** Number of students who improve their GPA by ≥0.3 points OR score a 4/5 on an AP exam after 90 days of active use.

**Mission:** Build the operating system for every high school student's academic life — unifying daily grade performance, AP exam mastery, AI tutoring, and social accountability into one intelligent, adaptive platform.

**The Core Belief:** Students don't fail because they're lazy. They fail because they don't have a *system*. AceOS is the system.

### 🧭 Four Founding Engineering Principles

These principles must be present in every sprint planning session, story grooming, and architecture decision from Day 1:

| Principle | What It Means in Practice |
|---|---|
| **1. Subject-Type Awareness** | Every feature must declare which subject rendering mode(s) it supports: `TEXT`, `VISUAL/STEM`, `LANGUAGE`. A question in AP Calc is not the same as AP Spanish — the content model, input method, and AI grading logic differ fundamentally. |
| **2. Pluggable-First Architecture** | Every integration point (LLM provider, payment processor, auth, email, storage, FSRS engine, analytics) is abstracted behind a provider interface. Swapping any vendor = config change, not a code rewrite. |
| **3. i18n & Localization Ready** | All UI strings, content schemas, and AI prompts must be structured to support multiple languages from Sprint 1. Even if we only ship English at launch, the pipes must be in place. |
| **4. Config-Driven Feature Flags** | Every feature, subject module, provider, and content type is toggleable via a central config/feature-flag system. This enables per-subject rollouts, A/B testing, and safe incremental launches. |

> **Sprint Planning Reminder:** At the start of every sprint and story grooming session, ask: *"Does this story respect all 4 founding principles? Is the subject type declared? Is the integration point abstracted? Is the string localizable? Is this feature-flagged?"* If not — the story is not ready.

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
| Foreign Language AP Enrollment | AP Spanish Language #2 most-taken AP exam nationally (~400K students/yr); AP French, AP Chinese, AP Japanese also significant |
| STEM Visual Learning Gap | AP Calc, AP Bio, AP Chem, AP Physics all require diagram annotation, graph interpretation, and formula rendering — zero existing AP prep tools handle this natively in a digital exam format |

**The Opportunity Gap:** No single product today unifies daily GPA maintenance + AP exam mastery + AI Socratic tutoring + social accountability under one adaptive student intelligence profile — *and* handles the full spectrum from essay-based humanities to visual STEM to spoken foreign language. That gap is the entire AceOS thesis.

---

*(Sections continue below — pushed incrementally)*
