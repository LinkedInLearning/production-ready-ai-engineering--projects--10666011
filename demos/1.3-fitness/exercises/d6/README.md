# Exercise D6 — Challenge: Fix a performance regression

**Chapter 3 (Performance) · Challenge → Solution**

A pull request slowed the app down. Your job is to find the regression, fix the real cause,
and **prove** the win with measurements — then confirm the performance budget passes again.

## Setup

The failing challenge state is a standalone folder — no branch switching needed:

```bash
cd demos/helpdesk-ai-06-perf-challenge
npm install && npm run dev
```

Work directly in that folder. To reset between attempts, run `git restore .` inside it.

## What's wrong (planted)

Two regressions were merged together:
1. **Frontend:** the vendor bundle is no longer code-split, so the JS budget is blown and LCP
   on the ticket list got worse.
2. **Backend:** `GET /api/tickets` now does synchronous, unindexed work on every request,
   raising P95 latency under load.

## Your task (with Claude Code)

1. Record a load trace of the ticket list with Chrome DevTools MCP and analyze the LCP
   breakdown. Prompt idea:
   > "Record a performance trace of http://localhost:5173, analyze the LCP breakdown, and
   > tell me the top contributor."
2. Profile `GET /api/tickets` under load (autocannon + a flame graph) to find the backend cause.
3. Fix both. Re-measure on the **same** harness; report before/after as raw numbers
   (median of at least 3 runs). Don't claim a win you can't show.
4. Run the budget gate and confirm it is green:
   ```bash
   npm run budget   # size-limit bundle-size gate (added in Demo D5; Lighthouse runs via `npm run lhci`)
   ```

## Done when

- The JS/bundle budget and the LCP budget both pass.
- You can state the measured LCP and P95 improvements with numbers.

## Reference

A worked solution lives in `demos/helpdesk-ai-07-perf-solution`. Try it yourself first.
