# AceOS

AP exam prep platform built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + custom age-gate flow
- **Styling**: Tailwind CSS + Framer Motion
- **Email**: Resend
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase and Resend keys
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint check |

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Full app URL (e.g. https://aceos.vercel.app) |
| `RESEND_API_KEY` | Resend API key for transactional email |
