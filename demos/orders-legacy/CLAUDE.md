# orders-legacy - project guide for Claude Code

A legacy order/inventory service. It works in production but is risky to change: **no tests**,
tangled modules, outdated dependencies, no logging or metrics, and secrets read straight from
the environment without validation. This is the brownfield anchor project for the course.

Used in:
- **Demo D14** - make legacy code safe to change: dependency-first analysis (plan mode),
  characterization tests that pin current behavior, then one safe first fix behind that net -
  the dashboard accessibility (contrast), which is CSS-only and cannot affect pinned behavior.
- **Demo D15** - raise the bar on the changes that touch behavior: fix performance (a synchronous
  dead rollup on the dashboard hot path) and security (stale deps + unvalidated, unauthed write
  endpoints) behind the characterization net, then add ratcheting CI gates at low floors.

## Reality of this codebase (do not "fix everything at once")

- `src/index.js` - Express app wiring routes directly to tangled handlers.
- `src/orders.js` - order logic, callback-style, mixed concerns (validation + pricing + I/O).
- `src/inventory.js` - inventory checks; duplicated logic; shared mutable state.
- `src/db.js` - in-memory "database" with no abstraction boundary.

## Working rules for this repo

- **Change behind seams.** Pin existing behavior with **characterization tests** before you
  refactor. Label them as behavior-locking, not correctness - they may capture current bugs.
- **Dependency-first.** Map what depends on what before touching a module.
- **Ratchet, don't rewrite.** Turn on a few gates now (lint, a low coverage/mutation floor)
  and raise them over time. No big-bang rewrite.
- Secrets come from the environment (`API_TOKEN`); never hard-code them.

## Commands

- `npm install && npm run dev` - run the service on http://localhost:4000 (operations dashboard at `/`, JSON API at `/orders`). `npm start` also works but warns when `API_TOKEN` is unset.
- `npm run smoke` - quick module-level smoke check.

## Known issues (intentional - these are the lessons)

- No tests, no observability - Demo D14 adds the first characterization tests.
- **Accessibility:** the operations dashboard has color-contrast failures (axe reports 8 nodes) -
  Demo D15 fixes the CSS tokens.
- **Performance:** `dashboardSnapshot` in `src/orders.js` runs a synchronous `supplierRisk` rollup
  on every render (~250ms for 8 orders) whose result is never displayed - dead work on the hot
  path. Demo D15 removes it; because nothing renders it, the shown numbers do not change.
- **Security:** no input validation or auth on write endpoints (`POST /orders`, `/quick-order`,
  `/orders/:id/reserve`). An empty `POST /orders` body is accepted and creates an itemless order
  that then makes reads 500; `API_TOKEN` exists but is never checked - Demo D15 fixes both. And
  outdated dependencies (express, body-parser, lodash) - `npm audit` reports several, one
  critical; Demo D15 surfaces and gates these rather than force-upgrading.
