# 00 - Set up the sample projects

**tl;dr: this course uses two local apps: one greenfield, one brownfield. Start them directly. Do not use a bash automation layer.**

The course has two demo apps under `demos/`.

`helpdesk-ai` is the greenfield app. It is a support operations workspace with an AI Suggested Reply feature, a React front end, a Fastify API, and a shared core package. It has queue filters, customer context, a reporting panel, related knowledge articles, and seeded tickets that look closer to real support work. It starts deliberately imperfect: missing UI states, accessibility defects, an oversized hero image, eager reporting work, synchronous queue scoring, weak tests, under-hardened AI behavior, and no reliability guardrails.

Run it like this:

```bash
cd demos/helpdesk-ai
npm install
npm run seed
npm run dev
```

The web app runs at http://localhost:5173. The API runs at http://localhost:3001. No API key is required; without `ANTHROPIC_API_KEY`, the Suggested Reply feature uses a deterministic mock.

`orders-legacy` is the brownfield app. It is a plain-JS Express service for orders, inventory, reservations, shipments, suppliers, returns, and audit events. It has callbacks, no tests, old dependencies, duplicated logic, validation gaps, synchronous dashboard work, and shared mutable state. It is intentionally not rewritten. The point is to raise the bar safely.

Run it like this:

```bash
cd demos/orders-legacy
npm install
npm run dev
```

The service runs at http://localhost:4000. A quick proof:

```bash
curl http://localhost:4000/orders
npm run smoke
```

For each episode, open the matching file in `scripts/`. The episode file contains the teleprompter copy, setup, Claude Code CLI workflow, Claude Code Desktop workflow, and related articles. That is the whole recording system now.

The default workflow is intentionally simple: start the app, paste the prompt into Claude Code, let the agent edit files, and make it run a verification command before it claims success.
