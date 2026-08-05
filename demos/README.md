# Demos

This folder has the two runnable apps for the course plus a set of read-only reference
snapshots. There is no bash automation layer: start the app, open the matching chapter in
[`../prompts`](../prompts), copy the prompt into Claude Code, and let the agent make the changes
directly.

You always work in the two baseline apps - **`helpdesk-ai`** (greenfield) and
**`orders-legacy`** (brownfield). Every other folder is a frozen, read-only "answer key":
the `<chapter>.<movie>-<slug>` folders are the finished state of each hands-on movie. Open one
when you want to compare your result to the finished (or deliberately broken) state. See
[Reference snapshots](#reference-snapshots) below.

> **`helpdesk-ai` is deliberately broken.** It ships the planted defects each episode fixes - a
> cross-boundary import, missing UI states, contrast failures, weak tests, an injection-prone
> mock - and it ships **no quality gates**: each episode adds its own. If `npm run fitness`
> already exists or already passes, your working copy is dirty. Reset it (see
> [Reset between exercises](#reset-between-exercises)) before you start.

## App 1: helpdesk-ai

Use this for the greenfield quality demos: architecture fitness, browser UX, accessibility,
performance, testing, AI evals, security, reliability, and CI. The app is
a support operations workspace with a triage queue, filters, customer context, reporting, knowledge
links, and an AI Suggested Reply flow.

```bash
cd demos/helpdesk-ai
npm install
npm run seed
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:3001.

Episode 02 (browser UX) needs `npm run dev:slow` instead - same app, but the API simulates a
4-second queue load so the missing loading state is actually observable. Plain `npm run dev` has
no delay, which keeps the performance episodes' latency numbers honest.

Useful checks:

```bash
npm run check
npm run typecheck
npm run test
```

No API key is needed. Without `ANTHROPIC_API_KEY`, the AI feature uses a deterministic mock.

## App 2: orders-legacy

Use this for the brownfield demos: making inherited code safe to change (map + characterization
tests + an accessibility fix), then raising the bar on the changes that touch behavior
(performance, security) and ratcheting CI gates. The app is an older
fulfillment console with orders, inventory, reservations, suppliers, shipments, returns, and audit
events all sharing a mutable in-memory model.

```bash
cd demos/orders-legacy
npm install
npm run dev
```

Open http://localhost:4000 for the operations dashboard. The JSON API is still available at
http://localhost:4000/orders.

Useful check:

```bash
npm run smoke
```

## Claude Code CLI workflow

1. `cd` into the app for the episode.
2. Run `claude`.
3. Copy the chapter's prompt from [`../prompts`](../prompts) and paste it into Claude Code.
4. Let Claude edit files and run the verification commands listed in the prompt.
5. Review the diff and keep the terminal output that proves the red-to-green moment.

For one-off headless checks, Claude Code's CLI also supports print mode:

```bash
claude -p "Run the checks for this repo and summarize failures with file paths."
```

## Claude Code Desktop workflow

1. Open Claude Code Desktop.
2. In the Code tab, choose the app folder as the project folder.
3. Use the integrated terminal to run the app command above.
4. Copy the chapter's prompt from [`../prompts`](../prompts) and paste it into the chat.
5. Ask Claude to show the changed files and the verification output before you move on.

## Reference snapshots

The demo apps used to be nested git repos with one branch per episode state. Those branches are
now flattened into standalone, committed folders so everything ships in the course repo. Each is
a self-contained copy of the app - run `npm install` inside it before use.

### Per-movie final states (`<chapter>.<movie>-<slug>`)

These are named for their position in the course TOC, so `4.2-a11y` is chapter 4, movie 2. Each is
the **finished** state of that movie - the shared `helpdesk-ai` baseline plus that movie's fix
*plus every fix before it*. They accumulate, so `7.2-ci` is the whole greenfield course applied.
There are no per-movie *start* folders: `helpdesk-ai` is the single clean start for every episode.

| Folder | Script | Final state adds |
| --- | --- | --- |
| `1.2-fitness` | `01-fitness-function` | Architecture fitness function; boundary violation removed |
| `2.2-verify-ux` | `02-verify-experience` | Loading / empty / error states; submit error + retry |
| `3.2-perf-profile` | `03-performance-profile` | Responsive hero, code-split panel, memoized work |
| `3.3-perf-budget` | `04-performance-budgets` | Bundle-size budget gate |
| `3.4-perf-challenge` | `05-performance-challenge-solution` | Challenge fixes; budget + API p95 green |
| `4.2-a11y` | `06-accessibility` | Badge contrast, labels, focus handling, live region |
| `5.2-mutation` | `07-testing-mutation` | Stryker wired; strengthened tests |
| `5.3-evals` | `08-testing-evals` | AI eval harness + output guardrail |
| `6.3-injection` | `09-security-injection` | Prompt isolation; mock no longer leaks |
| `6.4-scan` | `10-security-scan-agent` | Security gate |
| `6.5-security-challenge` | `11-security-challenge-solution` | Hardened escalate endpoint |
| `6.6-reliability` | `12-reliability` | Timeout, fallback, circuit breaker, telemetry |
| `7.2-ci` | `13-ci-gates` | Full gate stack assembled into CI |

> **Episodes 14 and 15 have no final folder** - they work in `orders-legacy` (brownfield), not
> `helpdesk-ai`, and that repo has no accumulated answer-key states. Their proof is terminal output
> (the dependency map, green characterization tests, the write-path fix, the CI gates), which you
> produce as you follow the video and the prompts.

## Reset between exercises

The demo apps are tracked as part of this repo. When you want to throw away your changes and
return an app to its starting state, run this from inside the app folder:

```bash
git restore . && git clean -fd
```

**Both halves matter.** `git restore .` only reverts *tracked* files. Every episode has you (via
Claude) *create* new ones - `.dependency-cruiser.cjs`, `stryker.conf.json`, `.size-limit.json`,
`.github/workflows/quality.yml`, `.claude/agents/reviewer.md` - and `git restore` leaves those on
disk. Skip the `git clean` and the next exercise starts with the previous one's gate already in
place, so it looks like the work is already done.

`git clean -fd` does **not** touch ignored files, so `node_modules/` and any captured `evidence/`
both survive. Verify you are clean with `git status --short` - blank means ready.

## Evidence and verification

Every quality episode proves its claim with a **measurement you can read in the terminal**: a
gate that went red then green, a latency table, a violation count, a Lighthouse score. That is
the default path, and it takes seconds.

Screenshots are a **separate, optional step**. Capturing annotated before/after frames makes a
defect *visible* rather than merely named, but it is slow. So the reference set is checked into
the repo - you can see what wrong and right look like without spending the time regenerating them.

### The checked-in reference set

`demos/helpdesk-ai/evidence/` is **committed**, not ignored. It holds the before/after visuals
captured once during production, so you can see what wrong and right look like without spending
the time. See [evidence/README.md](helpdesk-ai/evidence/README.md).

| Folder | Ep | Format | What the before/after shows |
| --- | --- | --- | --- |
| `ux-states/` | 02 | screenshots | silent failed submit and missing states → visible error + retry, loading, empty |
| `a11y/` | 06 | screenshots | low-contrast badges zoomed with their ratios, axe overlay → fixed |
| `perf/` | 03 | screenshots + Lighthouse reports | oversized hero and a poor score → optimized, LCP far lower |
| `mutation/` | 07 | screenshots | Stryker report, surviving mutants → killed |
| `injection/` | 09 | screenshots | leaked customer email list in the reply box → safe reply |
| `reliability/` | 12 | screenshots | hung UI and flat metrics → fast fallback + telemetry |
| `fitness/` | 01 | terminal output | gate red → green on the illegal `apps/web -> apps/api` edge |
| `perf-budget/` | 04 | terminal output | bundle over the budget → under |
| `perf-challenge/` | 05 | terminal output | budget and API p95 before/after |

Episodes 08, 10, 11, 13, 14 and 15 have no folder because their evidence is inherently textual -
eval results, security findings, CI checks, the brownfield dependency map and characterization runs. Their
scripts show that output on screen instead.

Frames you generate yourself land in these same folders and will appear as local modifications.
`git restore demos/helpdesk-ai/evidence` puts the reference set back.

> There is no `npm run evidence` command. Frames come from the optional prompt at the bottom of
> each script.

## Current docs checked

The demo flow follows the current Claude Code docs: Claude Code reads a codebase, edits files,
runs commands, and works in terminal, IDE, desktop app, and browser - including driving the
built-in browser to verify UI behavior and capture evidence. The key best-practice used
throughout is to give Claude a verification check it can run, and, where there is a UI, a
before/after frame it can capture.

- https://docs.anthropic.com/en/docs/claude-code/overview
- https://docs.anthropic.com/en/docs/claude-code/best-practices
- https://docs.anthropic.com/en/docs/claude-code/cli-reference
- https://docs.anthropic.com/en/docs/claude-code/desktop
