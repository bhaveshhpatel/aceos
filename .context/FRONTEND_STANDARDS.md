# AceOS — Frontend Standards
## Principal Frontend Engineer Reference | All Contributors

> **Status:** Canonical. Every frontend PR is reviewed against this document. No exceptions.
> **Audience:** Students aged 14–18 and their parents. Every UI decision serves them.

---

## 1. Non-Negotiable Rules

These are hard stops. A PR that violates any of these is rejected without further review.

1. **No pixel-fixed layouts.** Every layout must be fluid and tested at 375px (mobile), 768px (tablet), and 1280px (desktop).
2. **No hardcoded colors in component files.** All colors come from the Tailwind design token system (`tailwind.config.ts`). No `style={{ color: '#...' }}`.
3. **No images without `alt` text.** Accessibility is not optional. Empty `alt=""` only for purely decorative images.
4. **No font sizes below `text-sm` (14px).** Students read this on phones. Minimum tap target is 44×44px.
5. **No layout shift on load.** Skeleton screens are required for every async data fetch. No content popping in.
6. **No unhandled loading or error states in any component that fetches data.** Both states must be explicitly designed, not left to the browser default.
7. **No component renders more than one semantic concern.** A `<QuestionCard>` renders a question. It does not also manage submission state, timer logic, and error handling.
8. **No custom CSS unless Tailwind cannot express it.** Justify every custom CSS block in a PR comment.
9. **No third-party UI libraries outside the approved list.** See Section 4.
10. **Every interactive element must be keyboard-accessible and have a visible focus state.**

---

## 2. Design System & Visual Identity

### Color Palette
AceOS uses a vibrant, energetic palette built for a young, student-focused audience. All tokens are defined in `tailwind.config.ts`.

```ts
// tailwind.config.ts — design tokens (non-negotiable)
colors: {
  // Brand primaries
  brand: {
    50:  '#f0f4ff',
    100: '#e0eaff',
    200: '#c2d4ff',
    300: '#93b0ff',
    400: '#5c82ff',
    500: '#3355ff', // Primary CTA — buttons, links, focus rings
    600: '#2240dd',
    700: '#1a30b0',
    800: '#162690',
    900: '#131f75',
  },
  // Accent — energy, achievement, streaks
  accent: {
    400: '#fb923c', // orange-400
    500: '#f97316', // orange-500 — badges, streaks, highlights
  },
  // Success — correct answers, passed diagnostics
  success: {
    400: '#4ade80',
    500: '#22c55e',
  },
  // Danger — wrong answers, errors
  danger: {
    400: '#f87171',
    500: '#ef4444',
  },
  // Neutral — text, surfaces, borders
  neutral: {
    0:   '#ffffff',
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
}
```

### Typography
```ts
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],    // Body, UI
  display: ['Cal Sans', 'Inter', 'sans-serif'],   // Headings, hero
  mono: ['JetBrains Mono', 'monospace'],          // Code, math
},
fontSize: {
  // Minimum 14px enforced — no text-xs in main UI
  'display-xl': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
  'display-lg': ['2.5rem', { lineHeight: '1.15', fontWeight: '700' }],
  'display-md': ['2rem',   { lineHeight: '1.2',  fontWeight: '600' }],
  'heading':    ['1.5rem', { lineHeight: '1.3',  fontWeight: '600' }],
  'subheading': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
}
```

### Spacing & Radius
- Use Tailwind's 4px grid: `p-4` = 16px, `gap-6` = 24px, etc.
- Border radius: `rounded-xl` (12px) for cards, `rounded-full` for badges/pills, `rounded-lg` (8px) for inputs and buttons.
- Never use `rounded-none` except for full-bleed hero sections.

### Shadows & Elevation
```ts
// 3-level elevation system
boxShadow: {
  'card':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  'raised':  '0 4px 16px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
  'overlay': '0 20px 60px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)',
}
```

### Gradients
Gradients are used intentionally for hero sections, CTA buttons, and mastery indicators — not scattered throughout.
```ts
// Approved gradient tokens
'brand-gradient':   'linear-gradient(135deg, #3355ff 0%, #7c3aed 100%)'
'energy-gradient':  'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
'success-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
'surface-gradient': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
```

---

## 3. Responsive Design

### Breakpoint Strategy
```
Default (no prefix) = mobile-first base (375px+)
sm:  640px  — large phones, small tablets
md:  768px  — tablets (iPad portrait)
lg:  1024px — tablets landscape, small laptops
xl:  1280px — standard desktops
2xl: 1536px — large monitors
```

**Mobile-first always.** Write the mobile style first, then override upward. Never write desktop styles and try to undo them for mobile.

```tsx
// ✅ CORRECT — mobile first, scale up
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

// ❌ WRONG — desktop first, broken on mobile
<div className="grid grid-cols-3 gap-6 sm:grid-cols-1">
```

### Viewport Testing Requirement
Every PR touching layout must be verified at these exact widths before merge:
| Device | Width |
|---|---|
| iPhone SE (smallest supported) | 375px |
| iPhone 14 Pro | 390px |
| iPad Mini | 768px |
| iPad Pro | 1024px |
| MacBook Air | 1280px |
| Standard Desktop | 1440px |

### Touch Targets
- All interactive elements: minimum **44×44px** tap target.
- Use `min-h-[44px] min-w-[44px]` on small icon buttons.
- Bottom navigation on mobile: minimum 56px height.

### Navigation Patterns by Breakpoint
- **Mobile (< 768px):** Bottom tab bar OR hamburger drawer. No horizontal nav bar.
- **Tablet (768px–1023px):** Collapsible side nav OR top nav with icon labels.
- **Desktop (1024px+):** Persistent sidebar (240px) with full labels + top header.

---

## 4. Component Library & Approved Packages

### Approved UI Libraries
| Library | Purpose | Notes |
|---|---|---|
| `shadcn/ui` | Base primitives | Always copy into `components/ui/` — never import directly |
| `@radix-ui/*` | Accessible headless primitives | Via shadcn only |
| `framer-motion` | Animations and transitions | For meaningful motion only — not decorative |
| `lucide-react` | Icons | Sole icon library. No mixing with heroicons, etc. |
| `recharts` | Data visualization | For mastery charts, score history |
| `@tanstack/react-query` | Server state | Already approved in CODING_STANDARDS |

**Do NOT add new UI libraries without Lead Engineer approval.** Every new library goes into this table.

### Component Hierarchy
```
components/
├── ui/              # Base primitives (Button, Input, Badge, Card, Modal)
│                    # Sourced from shadcn — customized to AceOS design tokens
├── features/        # Feature-scoped components
│   ├── auth/        # SignUpForm, OAuthButton, AgeGate
│   ├── diagnostic/  # DiagnosticQuestion, TimerBar, ProgressRing
│   ├── mcq/         # MCQCard, ChoiceButton, ExplanationPanel
│   ├── frq/         # FRQPrompt, FRQTextArea, RubricHeatmap, ScoreDisplay
│   ├── mastery/     # MasteryMap, SubjectProgress, WeakAreaCard
│   └── dashboard/   # DashboardShell, ActivityFeed, StreakWidget
├── layouts/         # AppLayout, AuthLayout, PrintLayout
└── shared/          # Components used across 2+ features (PageHeader, EmptyState, Skeleton)
```

### Component File Structure
```tsx
// components/features/mcq/MCQCard.tsx

import type { MCQQuestion } from '@/types/question';

interface MCQCardProps {
  question: MCQQuestion;
  onSelect: (choiceId: string) => void;
  selectedId?: string;
  disabled?: boolean;
}

/**
 * Renders a single MCQ question card with answer choices.
 * Controlled — parent owns selection state.
 */
export function MCQCard({ question, onSelect, selectedId, disabled }: MCQCardProps) {
  // ... max 300 lines
}
```

Rules:
- Props interface always explicitly typed — never `any`, never inline `{ foo: string }`.
- Single named export per file. No default exports in `features/` or `ui/`.
- Component file name = component name = PascalCase.

---

## 5. Animation & Motion

Motion serves comprehension. It is never decorative noise.

### Approved Motion Patterns
| Interaction | Animation | Duration |
|---|---|---|
| Page transitions | Fade + 4px translate-y up | 200ms ease-out |
| Modal open/close | Scale 0.96→1 + fade | 150ms ease-out |
| Card hover | `translateY(-2px)` + shadow lift | 150ms ease |
| Correct answer reveal | Green flash + checkmark pop | 300ms spring |
| Wrong answer reveal | Red shake (2px left-right) | 300ms |
| Streak milestone | Confetti burst | One-time, < 2s |
| Score counter | Count-up tween | 600ms ease-out |
| Loading skeleton | Shimmer left→right | 1.5s infinite |

### Framer Motion Usage
```tsx
// ✅ CORRECT — meaningful, purposeful
<motion.div
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>

// ❌ WRONG — decorative, distracting, slow
<motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
```

### Accessibility — Reduced Motion
```tsx
// Always respect prefers-reduced-motion
import { useReducedMotion } from 'framer-motion';

const shouldReduce = useReducedMotion();
const variants = shouldReduce
  ? { initial: {}, animate: {} }   // no motion
  : { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } };
```

---

## 6. Accessibility (a11y)

AceOS serves students as young as 14, including those with visual and motor impairments. Accessibility is a product requirement, not a nice-to-have.

### Minimum Requirements (every component)
- Semantic HTML first: `<button>`, `<nav>`, `<main>`, `<section>`, `<h1>–<h6>` in correct order.
- All images: meaningful `alt` text or `alt=""` + `role="presentation"` for decorative.
- All form inputs: associated `<label>` via `htmlFor` — no `placeholder`-only labels.
- All interactive elements: visible `:focus-visible` ring using `ring-2 ring-brand-500 ring-offset-2`.
- Color contrast: minimum **4.5:1** for body text, **3:1** for large text and UI components (WCAG AA).
- Error messages: `role="alert"` so screen readers announce them immediately.

### ARIA Usage
```tsx
// ✅ Use ARIA only when semantic HTML is insufficient
<div role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100}>

// ❌ Never add ARIA to native elements that already have semantics
<button role="button">Submit</button>  // redundant — button already has role
```

### Focus Management
- Modal open: move focus to first focusable element inside modal.
- Modal close: return focus to trigger element.
- Route change: move focus to `<main>` or page `<h1>`.
- Use Radix UI primitives — they handle focus management correctly by default.

---

## 7. Performance

### Core Web Vitals Targets
| Metric | Target | Hard Limit |
|---|---|---|
| LCP (Largest Contentful Paint) | < 1.5s | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.1 |
| INP (Interaction to Next Paint) | < 100ms | < 200ms |
| FCP (First Contentful Paint) | < 0.8s | < 1.8s |

### Image Standards
```tsx
// ✅ Always use next/image
import Image from 'next/image';
<Image src="/hero.webp" alt="Student studying" width={800} height={600} priority />

// Rules:
// - WebP format for all photos and illustrations
// - SVG for icons and logos (inline or as <img>)
// - Explicit width + height always (prevents CLS)
// - priority prop on above-the-fold images only
// - Use sizes prop for responsive images
```

### Font Loading
```tsx
// app/layout.tsx — font preload strategy
import { Inter } from 'next/font/google';
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',   // prevent FOIT
  variable: '--font-inter',
  preload: true,
});
```

### Code Splitting
- Every page is automatically code-split by Next.js App Router — do not fight this.
- Use `dynamic()` imports with `{ ssr: false }` only for heavy client-only components (rich text editors, chart libraries).
- Never `dynamic()` import components that appear above the fold.

### Bundle Rules
- Run `next build` and check bundle sizes on every significant PR.
- No single page bundle > 250kB gzipped (excluding shared chunks).
- Flag any new dependency > 20kB (gzipped). Justify or find an alternative.

---

## 8. Skeleton & Loading States

Every component that fetches async data must have three explicit states: loading, error, and success. Skeleton screens are required — spinners alone are not acceptable for content areas.

```tsx
// ✅ Required pattern for every data-fetching component
if (isLoading) return <MCQCardSkeleton />;
if (isError)   return <ContentErrorState retry={refetch} message="Couldn't load question" />;
return <MCQCard question={data} onSelect={handleSelect} />;
```

### Skeleton Guidelines
- Skeleton shape must closely match the content shape (same dimensions, same grid).
- Use `animate-pulse` with `bg-neutral-200` blocks.
- Skeleton background: `bg-neutral-100`, shimmer: `bg-neutral-200`.
- Maximum skeleton display time before showing a timeout message: **8 seconds**.

---

## 9. Forms & Input Standards

```tsx
// Standard form field pattern — always this structure
<div className="flex flex-col gap-1.5">
  <label htmlFor="email" className="text-sm font-medium text-neutral-700">
    Email address
  </label>
  <input
    id="email"
    type="email"
    className="input-base"   // defined in globals.css as a @layer component
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
    {...register('email')}
  />
  {errors.email && (
    <p id="email-error" role="alert" className="text-sm text-danger-500">
      {errors.email.message}
    </p>
  )}
</div>
```

### Input States
| State | Classes |
|---|---|
| Default | `border-neutral-300 bg-white` |
| Focus | `border-brand-500 ring-2 ring-brand-500/20` |
| Error | `border-danger-500 ring-2 ring-danger-500/20` |
| Disabled | `bg-neutral-100 text-neutral-400 cursor-not-allowed` |
| Success | `border-success-500 ring-2 ring-success-500/20` |

### Button Hierarchy
```tsx
// 4-level button hierarchy — use the right level
<Button variant="primary">   {/* CTA — one per screen */}
<Button variant="secondary"> {/* Supporting action */}
<Button variant="ghost">     {/* Tertiary, nav items */}
<Button variant="danger">    {/* Destructive — confirm dialog required */}
```

---

## 10. Dark Mode

AceOS ships with **light mode only in Phase 1**. Dark mode is planned for Phase 2.

- Do NOT add `dark:` Tailwind variants yet. They create maintenance debt we are not ready for.
- Do NOT use CSS variables for colors yet — the design token system in `tailwind.config.ts` is sufficient.
- When dark mode is implemented, the migration will be systematic from the token layer up.

---

## 11. Code Review Checklist — Frontend

### Visual & Responsive
- [ ] Tested at 375px, 768px, 1280px (screenshots or Storybook snapshots)
- [ ] No horizontal scroll at any breakpoint
- [ ] All touch targets ≥ 44×44px
- [ ] No hardcoded colors — all from design tokens
- [ ] Images use `next/image` with explicit dimensions

### Accessibility
- [ ] Semantic HTML — correct heading hierarchy
- [ ] All form inputs have associated labels
- [ ] All images have meaningful `alt` text
- [ ] Keyboard navigation works end-to-end for the feature
- [ ] Error messages use `role="alert"`
- [ ] Focus states visible on all interactive elements

### Performance
- [ ] No layout shift (CLS = 0 for new content)
- [ ] Skeletons shown for all async data
- [ ] No above-the-fold dynamic imports
- [ ] No new bundle > 20kB (gzipped) without justification

### Code Quality
- [ ] Props interfaces fully typed — no `any`
- [ ] Single exported component per file
- [ ] No inline styles except computed values
- [ ] Framer Motion uses `useReducedMotion`
- [ ] Loading, error, and success states all handled

---

*AceOS Frontend Standards | Version 1.0 | April 2026*
*Owned by: Lead Frontend Engineer | Review cycle: per major phase*
