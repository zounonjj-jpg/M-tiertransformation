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

## Current modules\n- Business diagnostic (guided rules-based recommendations; no external LLM connected yet)\n- Offer builder with editable pricing tiers\n- Private prospect and client CRM\n- Digital Factory project blueprints for websites, catalogues, e-books, courses and mobile apps; saved to the user's private workspace\n\nThe Digital Factory currently creates structured project briefs and launch checklists. It does not yet generate finished websites, e-books, courses or apps automatically. Billing, subscription plans, automated outreach and the admin console remain future stages.
