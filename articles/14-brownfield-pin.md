# 14 - Make legacy code safe to change

**tl;dr: on inherited code, the first deliverable is not a fix — it is a net. Map the dependencies, then pin today's behavior with characterization tests, before you touch anything.**

`orders-legacy` is intentionally ordinary. Old dependencies, callbacks, no tests, duplicated logic, no input validation, synchronous dashboard work, and shared mutable state. It also works. Orders move, shipments show up, suppliers have lead times, and the ops form can create new work. That is the part it is easy to forget when you are staring at the mess.

So the move is not to rewrite. Rewrites turn one working system into two broken ones. The move is to make the code safe to change, and that happens in two steps before any edit.

## Dependency-first, in plan mode

Do the mapping pass read-only. On code you inherited and do not fully trust, keeping the agent in plan mode matters more than on greenfield — it maps the terrain before it can touch a line. Ask Claude to map `src/index.js`, `src/orders.js`, `src/inventory.js`, and `src/db.js`, and to name the risky edges: pricing mixed with fulfillment and I/O, inventory lookups duplicated across modules, reservations mutating shared arrays, the write paths trusting client input, and mutable data exported straight out of `db.js`.

The output is not a fix. It is a map of where the floorboards creak, so the next change is deliberate rather than lucky.

## Characterization tests: pin, don't judge

Characterization tests are behavior-locking, not correctness. They record what the system does **today** — including the quirks — so that when you change something later, any unintended difference shows up as a failing test instead of a support ticket.

Capture the expected values by running the real modules against the seed data, not by hand-writing what you think is correct. The `orders-legacy` pricing has two quirks worth pinning exactly as they are: VIP is a raw ten percent off with no rounding, and BULK only applies when there is more than one line item. If those look like bugs, that is precisely why you pin them — you change them later, deliberately, in a commit that explains why, and the test moves with the decision.

Green characterization tests plus a green smoke check mean the behavior is held in place. Now — and only now — you can change something.

## A safe first fix: accessibility

Start gentle. Run axe against the operations dashboard: `orders-legacy` reports eight color-contrast failures — amber and teal status pills and a brand badge that never quite met 4.5:1. This is a good first fix precisely because it is CSS only. It cannot touch the pricing or inventory logic the characterization tests just pinned, so it is nearly impossible to get wrong.

Fix the colors to meet the contrast bar, re-run axe to zero, and re-run the characterization tests. Still green — of course they are, but that is the habit worth building: every change, even a harmless-looking one, goes past the net. Next episode takes the same net into the changes that *do* touch behavior — performance and security — where the net stops being a formality and starts catching real regressions.
