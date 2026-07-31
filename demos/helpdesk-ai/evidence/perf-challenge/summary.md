# Performance challenge — before / after

Reference numbers from the production capture. Yours will differ in absolute terms; the
*direction and magnitude* are what the episode claims.

| Dimension | Before | After | How it was measured |
| --- | --- | --- | --- |
| JS bundle budget | 230 KB (over the 165 KB budget) | 156 KB (under) | `size-limit`, raw bytes — see `../perf-budget/*-budget.txt` |
| Hero image weight | 811 KB PNG | 40 KB WebP | build output — see `../perf/*-metrics.txt` |
| Lighthouse performance | 78 | 100 | Lighthouse CLI against a production build |
| LCP (Lighthouse, throttled) | 6.1 s | 1.7 s | same run as above |
| `GET /api/tickets` p50 | 151 ms | 4 ms | `autocannon -c 20 -d 5` |
| `GET /api/tickets` p97.5 | 308 ms | 8 ms | same run |
| `GET /api/tickets` throughput | 126 req/s | 4,474 req/s | same run |

## Notes on method

- **Lighthouse must target a production build** (`npm run build`, then
  `cd apps/web && npx vite preview --port 4173`). Dev-server numbers are meaningless.
- **LCP has two stories.** A `PerformanceObserver` in the page is unthrottled and optimistic — it
  reports this same page at roughly 250 ms before and 110 ms after. Lighthouse applies mobile CPU
  and network throttling and reports seconds. Both are correct; say which one you are quoting.
- **No artificial delay is in play.** `TICKETS_DELAY_MS` is 0 unless you start the app with
  `npm run dev:slow` (episode 02's simulated slow queue). Measure with plain `npm run dev` or a
  directly-started server, and these numbers are real compute.
- **Seed size matters.** These figures are at the shipped 100-ticket seed. The scan is O(n²), so
  at the old 12-ticket seed the whole effect disappears into noise (p95 ~20 ms either way).
