# NEXBIZ AI

NEXBIZ AI helps people turn a profession, skill, idea or business challenge into a practical digital solution and a testable revenue opportunity.

## Stack
- Next.js 15 / React 19
- Supabase Auth and Postgres with owner-scoped Row Level Security
- Vercel production deployment
- Optional Vercel AI Gateway for the real conversational strategy engine

## Local setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and publishable/anon key.
4. Run `npm run dev`.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_GATEWAY_API_KEY` (optional until AI Gateway is explicitly activated)
- `AI_GATEWAY_MODEL` (defaults to `google/gemini-2.5-flash-lite`)

Never put a Supabase service-role key or an AI provider secret in browser code or a public environment variable.

## Product direction
- Chat-first experience: no mandatory profession profile before starting a project.
- Multiple independent projects and conversation histories per user.
- Optional post-registration questions.
- User-owned project and message records protected by RLS.
- Digital Factory blueprints and editable content drafts for websites, catalogues, e-books, courses and mobile apps.
- Offer builder and private prospect/client CRM.

## Conversational strategy engine
The authenticated server route `POST /api/chat`:
- Verifies the Supabase user session.
- Verifies that the requested project belongs to the authenticated user.
- Loads recent project conversation history.
- Sends the conversation to the selected AI Gateway model using a business-transformation system prompt.
- Saves the assistant response in the same project.
- Handles missing credentials, insufficient credits, access failures, rate limits and provider errors without inventing an AI response.

The AI engine is intentionally disabled until `AI_GATEWAY_API_KEY` is configured on the server. This prevents unapproved metered AI usage. No key or provider secret is committed to this repository.

## Quality and revenue standards
The strategy prompt requires the assistant to distinguish user-provided facts, assumptions, items requiring verification and recommendations. Revenue scenarios must show their arithmetic and assumptions. The assistant must not guarantee income or claim market validation without evidence.

## Still planned
Document and image imports, voice transcription, image generation, spreadsheet exports, subscription billing, advanced market research and workflow automation are not yet implemented.
