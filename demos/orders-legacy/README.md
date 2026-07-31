# orders-legacy demo app

The brownfield app for the course: an older order, inventory, and fulfillment service with
plain-JS Express, callback-style modules, no tests, outdated dependencies, and no observability.
It works, but it is risky to change. That is the point.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4000
npm run smoke      # quick module-level smoke check
```

Open http://localhost:4000 for the operations dashboard.

## Endpoints

- `GET  /` - legacy operations dashboard
- `GET  /orders` - list orders
- `GET  /orders/:id` - one order (computes a total)
- `POST /orders` - create an order (NO validation - intentional)
- `POST /quick-order` - UI intake path (NO validation - intentional)
- `POST /orders/:id/reserve` - reserve stock (NO validation - intentional)
- `GET  /inventory/:sku` - stock for a SKU
- `GET  /shipments` - shipment exceptions
- `GET  /suppliers` - supplier lead-time risk
- `GET  /returns` - open returns
- `GET  /audit-log` - recent audit events

## Why it's here

This repo is deliberately messy: tangled modules, duplicated logic, shared mutable state,
hard-coded discount rules, validation gaps, synchronous dashboard work, and dependencies with
known CVEs. The course does **not** rewrite it - it shows how to raise quality on legacy code
incrementally with Claude Code:
dependency-first analysis, characterization tests, an adapter seam, and ratcheting gates.

## Reset a take

This folder is tracked in the course repo (it is no longer its own git repo). To throw away
edits from the last take, run from inside this folder:

```bash
git restore .
npm install
```

That restores tracked files to the committed baseline. If a take generated throwaway
files, delete those specific files after checking `git status --short`.
