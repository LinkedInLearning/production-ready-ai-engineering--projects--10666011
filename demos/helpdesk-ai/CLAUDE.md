# helpdesk-ai - project guide for Claude Code

Helpdesk AI is a customer-support app. Support agents triage tickets, and an **AI Suggested
Reply** feature drafts responses. This repo is the greenfield anchor project for the
"Production-Ready AI Engineering" course: each chapter improves one dimension of quality.

## Architecture (and the boundary rule)

- `apps/web` - Vite + React + TypeScript UI.
- `apps/api` - Fastify + TypeScript REST API. Hosts the server-side LLM calls.
- `packages/core` - framework-free business logic (SLA, priority). Unit-test target.

**Boundary rule (the quality bar starts here):**
- `apps/web` MUST talk to the backend only over the HTTP API.
- `apps/web` MUST NOT import from `apps/api/**` and MUST NOT deep-import server-only code.
- Shared types/logic belong in `@helpdesk/core`.

> This rule is documented here but not yet enforced. Demo D1 turns it into an executable
> fitness function so it can't be silently violated.

## DO NOT

- Do NOT feed raw, attacker-controlled ticket text straight into the model with tool/network
  access (the lethal trifecta). Isolate untrusted content; least privilege.
- Do NOT add a dependency without verifying it actually exists and is maintained.
- Do NOT claim a performance win without before/after measurements (median of N).
- Do NOT mark work "done" if tests, the perf budget, a11y, or security gates are red.
- Do NOT commit secrets. The API key is read from `ANTHROPIC_API_KEY` only.

## Security rules (agents MUST follow)

These are the rules the security chapter (D10) makes executable as an `npm run security` gate.
Until then they are documented here and followed by hand - like the boundary rule above.

- **No secrets in files.** Secrets come from the environment only (`ANTHROPIC_API_KEY`); never
  hardcode keys/tokens/passwords in source, tests, config, or `data/`. Keep `.env` gitignored.
- **Least privilege.** Give every component only the access it needs. The AI Suggested Reply
  gets one ticket's content and **no tools/network** beyond the model call; server code touches
  only the data the request requires. Don't widen scope "just in case".
- **Validate inputs at trust boundaries.** Treat anything crossing a boundary as untrusted:
  HTTP request bodies/params, and - especially - ticket text fed to the model. Isolate untrusted
  content in prompts and validate model output before it is surfaced (the `guardReply` guardrail
  in `apps/api/src/llm.ts`).
- **Once the security gate exists, run it before claiming done.** The security chapter adds
  `npm run security`; from then on it must be green (alongside `typecheck` and `test`) before a
  change is called complete. It blocks on secrets, `.env` hygiene, a raw-HTML sink, the AI
  guardrail being wired, and CRITICAL production dependency advisories; it reports HIGH/MODERATE
  advisories as warnings to triage.

## Commands

- `npm run dev` - run API (http://localhost:3001) and web (http://localhost:5173).
- `npm run test` - unit tests for `@helpdesk/core`.
- `npm run typecheck` - type-check all packages.

> Quality gates (`fitness`, `budget`, `mutation`, `evals`, `security`, ...) are **not** pre-wired.
> Each chapter turns one part of the quality bar into an executable `npm run` check, so in the
> starting state only `dev`, `build`, `check`, `test`, and `typecheck` exist.

## Quality bar (target, raised over the course)

- UX: loading/empty/error states verified in a real browser; no new console errors on load.
- Performance: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1; JS + image budgets enforced in CI.
- Accessibility: WCAG 2.2 AA; zero automated axe violations + keyboard/screen-reader verified.
- Testing: mutation score gate on `packages/core`; evals gate on the AI feature.
- Security: `npm run security` green (secrets, `.env`, AI guardrail, prod-critical deps);
  `/security-review` + SAST clean; deps verified; agent runs least-privilege.
- Reliability: OpenTelemetry traces/SLO; AI calls have timeout, fallback, and a guardrail.

## Notes for agents

- The AI Suggested Reply lives in `apps/api/src/llm.ts`. With no `ANTHROPIC_API_KEY` it uses a
  deterministic mock so demos run offline. The mock intentionally reproduces an
  injection-vulnerable code path until Demo D11 hardens it.
- Seed tickets are in `data/tickets.json` - 100 tickets (one carries an injection payload, by
  design). The size is deliberate: the O(n^2) related-ticket scan in `GET /api/tickets` is only
  measurably slow at this volume (p95 ~168ms under 20 concurrent requests, versus ~20ms at 12
  tickets). Do not shrink the seed.
