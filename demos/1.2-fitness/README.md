# helpdesk-ai demo app

The greenfield app for the course. It is a customer-support operations workspace with a
React UI, a Fastify API, shared business logic, and an AI Suggested Reply feature. The UI has a
triage queue, search and filters, customer context, reporting, related knowledge articles, and a
compose flow. It starts deliberately imperfect so Claude Code can make the production-quality
improvements live.

## Quick start

```bash
npm install
npm run seed        # quick environment check
npm run dev         # API on :3001, web on :5173
```

Open http://localhost:5173. No API key is required: without `ANTHROPIC_API_KEY`,
the AI Suggested Reply uses a deterministic mock so every demo runs offline.

## Useful checks

```bash
npm run check       # seed + typecheck + unit tests
npm run typecheck
npm run test
```

## Layout

```
apps/web        Vite + React UI (queue, filters, reporting, compose + AI reply)
apps/api        Fastify REST API (tickets, reply, server-side LLM)
packages/core   Framework-free logic (SLA, priority) - the unit-test target
data/tickets.json  Seed data (includes one injection-payload ticket, by design)
exercises/      Per-demo starting prompts (e.g., d6, d13)
```

## Known starting-state issues (intentional - these are the lessons)

- `apps/web` imports a server-only module from `apps/api` (`suggestFlag` from the
  feature-flag module) - the boundary violation the Ch1 fitness function catches.
- The queue has no loading, empty, or error states, and the compose submit is
  optimistic: it clears the box and shows "Reply sent." even when the send fails, so
  the agent never learns it did not go out (Ch2, UX).
- The compose dialog has accessibility defects: an unlabeled textarea, a nameless
  icon-only send button, a focus trap Escape cannot exit with no focus restoration, a
  visual-only status (no live region), and low-contrast priority badges (Ch3, a11y).
- Performance (Ch3/Ch4): an oversized, dimensionless hero image (LCP + layout shift,
  not preloaded); the reporting panel is imported eagerly into the main bundle and
  recomputes real reporting work on every render, unmemoized (a code-split + memoize
  target, distinct from the Ch3 bundle-size budget); and `GET /api/tickets` runs an
  O(n^2) similarity scan synchronously on every request, blocking the event loop.
- `packages/core` has high line coverage but weak assertions, so mutants survive (Ch5).
- The AI Suggested Reply feeds raw untrusted ticket text to the model with no isolation
  and no output guardrail; the offline mock is injection-vulnerable and leaks a fake
  customer email list on ticket `T-1006` (Ch6, security).
- The `/api/tickets/:id/reply` endpoint is unvalidated and trusts the request body (Ch6).
- The model call has no timeout, retry, circuit breaker, or fallback, and there is no
  observability (Ch7, reliability).
- No quality gates are wired yet - only `dev`, `build`, `check`, `test`, and `typecheck`
  exist; each chapter turns one part of the quality bar into an executable `npm run` check.

## Reset a take

This folder is tracked in the course repo (it is no longer its own git repo). To throw away
edits from the last take, run from inside this folder:

```bash
git restore .
npm install
```

That restores tracked files to the committed baseline. If a take generated throwaway
files, delete those specific files after checking `git status --short`.

Need the finished state for an episode? See the read-only `helpdesk-ai-*` reference folders
listed in `../README.md`.
