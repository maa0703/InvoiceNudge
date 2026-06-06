# InvoiceNudge
Automated invoice reminder SaaS for freelancers. Sends up to 4 templated follow-up emails after a
freelancer activates an invoice, with a 3-hour cancellation window before each send.
Status: Tier 1 — Scaffold

Architecture: Next.js 15 App Router full-stack monolith. Vercel deployment. Vercel Cron for reminders.
Stack: next@15, prisma@6, @clerk/nextjs@6, stripe@17, resend@4, pdf-parse@1, zod@3, swr@2
Tenancy: Single-user. Isolation key: userId. EVERY query must include where: { userId: session.userId }
ORM note: Supabase used as PostgreSQL host only. All DB access via Prisma — NOT via Supabase client SDK.
No AI dependency: email copy uses hardcoded templates (src/lib/email-templates.ts). PDF extraction uses pdf-parse + regex (src/lib/pdf-extractor.ts). Zero external AI calls.

Security rules (NEVER violate):
  - Every protected route: const { userId } = await auth(); if (!userId) return 401 — FIRST LINE
  - Every DB query on user data: include where: { userId } — no exceptions
  - Stripe webhook: await stripe.webhooks.constructEventAsync(rawBody, sig, secret) — LINE 1
  - Never return Prisma errors to client: catch → log → return { error: 'INTERNAL_ERROR' }
  - Never use localStorage for session tokens — Clerk handles HTTP-only cookies
  - All IDs in URLs are CUIDs (cuid2) — never expose sequential integers
  - Checkin-cancel route: token auth only (no Clerk session) — validate token + expiry before any DB write

Folder rules:
  app/          → Next.js pages and API routes ONLY — no business logic
  server/       → *.repo.ts (DB only) and *.service.ts (business logic only)
  lib/          → singleton clients (db, stripe, resend), email-templates.ts, pdf-extractor.ts, and ALL Zod schemas in validations.ts
  components/   → React components only — never import from server/ or lib/db

Build order: prisma schema → *.repo.ts → *.service.ts → validations.ts → API route → page.tsx

Commands:
  npm run dev           → localhost:3000
  npx tsc --noEmit      → type check
  npx prisma studio     → inspect DB
  npm run test          → Vitest unit tests
  npm run test:e2e      → Playwright E2E
  stripe listen --forward-to localhost:3000/api/webhooks/stripe → local webhook tunnel

Current phase: Tier 1 — Scaffold

Banned patterns:
  - import { db } from '@/lib/db' inside any route handler (use service layer)
  - import { invoiceService } from '@/server/...' inside any component
  - process.env.STRIPE_SECRET_KEY inside any component file
  - Direct Supabase SDK calls — Prisma only
  - fetch() to any external API from a React component
