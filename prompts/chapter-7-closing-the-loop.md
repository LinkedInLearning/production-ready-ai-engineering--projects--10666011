# Chapter 7 - Closing the Loop: Quality Gates and Legacy Code

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 7.2 - Enforce quality gates in CI

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Create a GitHub Actions quality workflow for the checks this repo actually exposes today. Detect package scripts first. Include install/cache, typecheck, unit tests, and any present `budget`, `evals`, or `security` commands. Keep placeholders commented only if the command does not exist yet.

Then run the equivalent checks locally and print a table in the terminal: one row per gate, the exact command, and pass/fail with its exit code. Show me the workflow file. Do not push, do not trigger a real Actions run, and do not write screenshots or report files.
```

**Prompt 2 - Then**

```text
Add a custom PR policy gate in the simplest maintainable form: every new API route under apps/api/src/routes must validate input, and any route that calls the LLM must have an eval case. It can be a script or a bounded Claude Code/Agent SDK step, but it must fail with file:line findings.

Demonstrate it locally on a small bad change - add an unvalidated route - and show the gate failing with the offending file:line and a non-zero exit code. Then fix the change and re-run it green. Print the before/after run output in the terminal; do not write screenshots or report files, and do not open a real pull request.
```

**Prompt 3 - Then move enforcement one step earlier with a local hook**

```text
Add a local hook that runs the fast gates (typecheck, unit tests, and the fitness check) and blocks completion/commit while any of them is red - a Stop hook and/or a pre-commit hook, whichever fits this repo. Keep it fast enough to run on every change.

Show the config, then demonstrate it in the terminal: make a red change and show the hook refusing it, fix it and show the same change passing. Print both runs; no screenshots, no report files. Note any version-specific hook syntax you used.
```


## 7.3 - Make legacy code safe to change

**App:** `demos/orders-legacy`

**Start:**
```bash
cd demos/orders-legacy
npm run dev   # one terminal, so the dashboard is live for axe
```

**Requires axe + Playwright (one-time, in this app):**

```bash
npm i -D @axe-core/playwright playwright && npx playwright install chromium
```

**Prompt 1 - Enter plan mode first (read-only, so the mapping pass cannot touch the legacy code), then**

```text
Inspect this legacy service before any edit. Map the dependencies between src/index.js, src/orders.js, src/inventory.js, and src/db.js - print the map as a text tree in the terminal; do not write files. For each module, call out in one line: mixed concerns, duplicated logic, shared mutable state, and validation gaps. Name the one or two places a future change would be riskiest. Do not edit anything - I want the terrain, not a fix.
```

**Prompt 2 - Exit plan mode, then**

```text
Write characterization tests that pin the CURRENT observable behavior of this service - behavior-locking, not correctness. Capture today's real outputs as the expected values by running the actual modules against the seed data in src/db.js; do not hand-write values you think are correct. Cover at least: order totals (calcTotal) with no coupon, the VIP discount, the BULK discount including the case where it does NOT apply, inventory availableToPromise, and reorderStatus. Add a header comment saying these lock behavior and may encode current bugs on purpose. Wire them to `npm run test` (node --test), run them, and run `npm run smoke`. Print both results - do not change any file under src/.
```

**Prompt 3 - Then the first fix, behind the net**

```text
Now fix accessibility, with the characterization tests as the safety net. Write a small script using Playwright + @axe-core/playwright that loads the dashboard at http://localhost:4000/ and reports WCAG 2.2 AA violations with node counts and measured contrast ratios. Run it and show me the failures. Then fix them to meet 4.5:1 by adjusting the dashboard's CSS colors only (the palette tokens in public/styles.css and the few inline color literals). Re-run axe to show zero violations, then re-run `npm run test` and `npm run smoke` to show behavior is untouched. Print the before/after violation counts.
```


## 7.4 - Raise the legacy bar: performance, security, and gates

**App:** `demos/orders-legacy`

**Start:**
```bash
cd demos/orders-legacy
npm run dev   # one terminal, so the dashboard and API are live
```

**Prompt 1 - First, the performance fix**

```text
Time the dashboard render three times: `curl -s -o /dev/null -w "%{time_total}\n" http://localhost:4000/`. It is far too slow for eight orders. Find why in the source, name the exact function and lines, and tell me whether the expensive result is used anywhere. Then fix it behind the characterization tests: remove the synchronous work from the dashboard hot path. Because its result is not displayed, deleting it must not change any shown value. Re-run `npm run test` and `npm run smoke` to prove behavior is unchanged, then re-time GET / (expect single-digit ms). Print the before/after.
```

**Prompt 2 - Then the security fix**

```text
Show me the write-path bug first, then fix it. Run:
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' http://localhost:4000/orders
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/orders
Explain why the empty POST returns 200 but the next GET returns 500, and confirm no API token was required.

Then fix it behind the characterization tests (they must stay green). Validate input at the write boundary (POST /orders, /quick-order, /orders/:id/reserve): reject a body with no valid line items with a 400, coerce the obvious numeric fields, and require the correct `x-api-token` on writes with a 401 when missing. Leave every read endpoint exactly as it is. Re-run `npm run test` and `npm run smoke`, and re-run the two curls (now with a valid token for the good case) to show the empty body getting a 400 and a well-formed authorized order still succeeding.

Finally run `npm audit` and summarize the counts and the worst advisory - do NOT run `npm audit fix --force`; we make the risk visible and gate it.
```

**Prompt 3 - Then ratchet everything into gates**

```text
Turn the work from these two episodes into ratcheting CI gates for this repo, at floors today's code clears: a static parse check wired to `npm run lint` (node --check, zero new dependencies), the characterization tests, the smoke check, the accessibility scan from episode 14, and `npm audit` as INFORMATIONAL for now. Wire them into a GitHub Actions workflow scoped to this repo. Run each locally and print its exit code, show me the workflow file, and comment each gate with the next notch to raise it to. Do not attempt a rewrite.
```

