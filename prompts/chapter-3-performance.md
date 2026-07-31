# Chapter 3 - Dimension: Performance

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 3.2 - Profile and fix performance

**App:** `demos/helpdesk-ai`

**Requires the Chrome DevTools MCP (one-time):**

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

**Prompt 1 - Enter plan mode first (read-only, so Claude cannot edit while it measures), then**

```text
Measure before changing code. Do not take screenshots and do not write report files - print the numbers in the terminal.

Build and serve the production bundle first, because dev-server numbers are meaningless here:
  npm run build
  (cd apps/web && npx vite preview --port 4173 &)

Then use the chrome-devtools MCP against http://localhost:4173. Call `emulate` with networkConditions "Slow 4G" and cpuThrottlingRate 4, then run `performance_start_trace` with reload true and autoStop true.

Report: LCP and CLS, the full LCP breakdown (TTFB, load delay, load duration, render delay), which element is the LCP, and the insights the trace surfaces. Tell me which subpart dominates LCP and what that implies. Also report the chunks the build emitted and whether the reporting panel is in the initial chunk. Then tell me the exact files you would change. Do not fix yet.
```

**Prompt 2 - Then exit plan mode to let it implement the fix, and**

```text
Fix only the bottlenecks the trace named: reserve space and right-size/prioritize the hero image, and code-split + defer/memoize the reporting panel. Then rebuild, re-run the identical trace - same Slow 4G and 4x CPU emulation, same production preview on 4173 - and print a before/after table: LCP, each LCP subpart, CLS, and initial chunk size. The load-delay row is the one that has to move. Finish with `npm run typecheck`.
```

**Prompt 3 - Backend beat - `autocannon` gives a percentile table in about six seconds**

```text
GET /api/tickets computes an O(n^2) similarity scan synchronously on every request, so it blocks the event loop under load. Measure it first:
  (cd apps/api && npx tsx src/server.ts &)
  npx -y autocannon@7 -c 20 -d 5 -l http://localhost:3001/api/tickets

Report p50/p97.5/max latency and requests per second. Then move the scan off the hot path or cache it safely, re-run the identical autocannon command, and print a before/after latency table. Do not change the response shape.
```


## 3.3 - Gate performance budgets and prove real wins

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Add a `npm run budget` gate for this repo using size-limit. It should build the web app, measure the JavaScript the initial route ships, and fail when that exceeds a threshold set just above today's real number.

Configure size-limit with `"gzip": false` and `"brotli": false` so the reported number is the raw bundle size and matches the build output - size-limit measures brotli by default, which would report roughly a quarter of the real size.

Run it and report the measured baseline and the threshold you chose, in the terminal. Do not write screenshots or report files. Keep the setup simple enough for a course demo.
```

**Prompt 2 - Then**

```text
Prove the budget catches a regression. Introduce a small, realistic bundle regression by importing all of lodash for one helper in the web app, or by making the reporting panel pull extra code into the initial route. Run `npm run budget` and show it failing.

Then fix the regression with a scoped import, native code, or lazy loading, re-run `npm run budget`, and show it passing.

Print a before/after table in the terminal - measured size, limit, and the delta for each run. Do not write screenshots or report files, and do not claim any performance win without before/after numbers from the same harness.
```


## 3.4 - Performance: break it, then fix it

**App:** `demos/helpdesk-ai`

**Requires the Chrome DevTools MCP (one-time):**

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

**Prompt 1 - First, plant the regression and capture the failing baseline**

```text
Set up a performance challenge for me in this repo. Plant realistic regressions in the current helpdesk workspace: a front-end bundle regression caused by importing too much lodash for one helper, heavier eager work in the reporting panel, and an API regression caused by extra synchronous per-request work in GET /api/tickets.

Then measure the failing baseline three ways and report the numbers in the terminal.

1. Bundle:  npm run budget
2. Page:    npm run build && (cd apps/web && npx vite preview --port 4173 &)
   then via the chrome-devtools MCP, call `emulate` with networkConditions "Slow 4G" and cpuThrottlingRate 4, followed by `performance_start_trace` with reload true and autoStop true against http://localhost:4173
3. API:     (cd apps/api && npx tsx src/server.ts &) && npx -y autocannon@7 -c 20 -d 5 -l http://localhost:3001/api/tickets

The trace must hit the preview build on 4173, not the dev server - dev-server numbers are meaningless.

Report measured bundle size vs limit, LCP with its breakdown (TTFB, load delay, load duration, render delay), CLS, and p50/p97.5/max latency plus requests per second. Do not write screenshots or report files - I want the numbers on screen. Do not fix the regressions.
```

**Prompt 2 - Then solve it against that baseline**

```text
Solve the performance challenge. Use the failing budget, the trace, and the autocannon baseline as the source of truth. Fix the front-end lodash regression without broad imports. If reporting is on the critical path, lazy-load or defer it without changing user-visible behavior. Fix the synchronous work in GET /api/tickets without changing the response shape.

Then re-run the three identical measurements from the baseline - same throttled trace on the rebuilt preview at 4173, same autocannon run - and print one before/after table in the terminal with these rows: bundle size vs limit, budget pass/fail, LCP, LCP load delay, CLS, API p97.5 latency, and requests per second. Finish with `npm run typecheck`.

Do not write screenshots or report files. If a difference is small enough to be noise across runs, say so instead of claiming the win.
```

