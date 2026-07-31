# 15 - Raise the legacy bar: performance, security, and gates

**tl;dr: with the net in place and accessibility already fixed, take on the changes that touch behavior — performance and security — behind the characterization tests, then ratchet everything into low-floor gates.**

Episode 14 made `orders-legacy` safe to change and did one gentle fix — accessibility. This is where the net earns its keep: performance and security are changes that actually touch behavior, and the green tests are what let you make them without holding your breath.

## Performance: dead work on the hot path

Time `GET /`. It takes roughly 250ms to render a page with eight orders, because `dashboardSnapshot` runs a synchronous supplier-risk rollup on every request — and its result is never displayed. Expensive dead work on the hot path is a classic brownfield smell: a decision made once and stepped around ever since. Remove it and the dashboard renders in single-digit milliseconds. Because nothing displayed that value, no shown number moves, and the characterization tests stay green.

## Security: the write boundary

`npm audit` reports eight advisories, one critical, against stale express, body-parser, and lodash. And the write endpoints validate nothing: an empty `POST /orders` body returns 200, and the next read returns 500 because it totals an itemless order. No token is required to make that write — one anonymous, malformed request corrupts the store and takes down reads.

This is the change you are scared to make in legacy code, because you cannot see what depends on the current behavior. But now you can. Validate the write boundary and require the API token, leaving the read paths untouched: the empty body returns a clean 400, an un-authed write returns 401. The characterization tests stay green — proof you changed the write path and nothing underneath. On the stale dependencies, do not `npm audit fix --force` and pray; make the risk visible and gate it.

Each change keeps the characterization tests green. That is the legacy-specific discipline — the net makes real fixes low-risk.

## Ratchet, don't rewrite

Turn the audit into gates at floors today's code clears: the accessibility scan, a static parse check, the characterization tests, the smoke check, and `npm audit` as informational for now. A gate that starts impossible gets ignored; a gate that starts green and only moves up can change a codebase over time. Put the audit on a schedule so the floor keeps rising whether or not anyone remembers to push it.

The operating rule stays the same: no rewrite heroics. One safe, reversible improvement at a time, each one protected by the net.
