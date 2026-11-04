# NEXBIZ AI

NEXBIZ AI helps people turn their profession, skills and experience into a structured digital business.

## Stack
- Next.js 15 / React 19
- Supabase Auth and Postgres
- Vercel deployment

## Local setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and publishable/anon key.
4. Run `npm run dev`.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never put a Supabase service-role key in browser code or a public environment variable.

## Current MVP
- Public landing page
- Sign up and sign in with role selection
- User workspace
- Business profile intake form
- Row Level Security for user-owned records

The AI business analysis, project generation, CRM, billing and admin console are planned next stages and are not yet enabled.
