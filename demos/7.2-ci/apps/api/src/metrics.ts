// Lightweight, in-process reliability metrics for the AI Suggested Reply path.
// No external infrastructure. Tracks the canary (AI) and baseline (template)
// cohorts separately so a rollout can be compared against baseline, and flags an
// SLO breach for the canary. Readable via GET /api/metrics.

export type Cohort = "canary" | "baseline";
export type SuggestSource = "model" | "mock" | "template";

export interface SuggestTrace {
  at: string;
  cohort: Cohort;
  latencyMs: number;
  outcome: "ok" | "fallback" | "error";
  source: SuggestSource;
}

interface Agg {
  total: number;
  errors: number;
  degradedTotal: number;
  lastDegraded: boolean;
  latencies: number[];
}

const MAX_LATENCY_SAMPLES = 1000;
const MAX_RECENT = 10;

function freshAgg(): Agg {
  return { total: 0, errors: 0, degradedTotal: 0, lastDegraded: false, latencies: [] };
}

const cohorts: Record<Cohort, Agg> = { canary: freshAgg(), baseline: freshAgg() };
const recent: SuggestTrace[] = [];

export function recordSuggest(input: {
  cohort: Cohort;
  latencyMs: number;
  error: boolean;
  degraded: boolean;
  source: SuggestSource;
}): void {
  const a = cohorts[input.cohort];
  const latencyMs = Math.round(input.latencyMs);

  a.total += 1;
  if (input.error) a.errors += 1;
  if (input.degraded) a.degradedTotal += 1;
  a.lastDegraded = input.degraded;
  a.latencies.push(latencyMs);
  if (a.latencies.length > MAX_LATENCY_SAMPLES) a.latencies.shift();

  const outcome = input.error ? "error" : input.degraded ? "fallback" : "ok";
  recent.unshift({ at: new Date().toISOString(), cohort: input.cohort, latencyMs, outcome, source: input.source });
  if (recent.length > MAX_RECENT) recent.pop();
}

function cohortStats(a: Agg) {
  const sorted = [...a.latencies].sort((x, y) => x - y);
  const n = sorted.length;
  const pct = (p: number) => (n ? sorted[Math.min(n - 1, Math.floor((p / 100) * n))] : 0);
  const sum = sorted.reduce((x, y) => x + y, 0);
  return {
    total: a.total,
    errors: a.errors,
    errorRate: a.total ? Number((a.errors / a.total).toFixed(4)) : 0,
    degraded: a.lastDegraded,
    latencyMs: {
      count: n,
      avg: n ? Math.round(sum / n) : 0,
      p50: pct(50),
      p95: pct(95),
      max: n ? sorted[n - 1] : 0,
    },
  };
}

// Canary guardrail thresholds (env-overridable for the demo).
function canarySlo() {
  return {
    maxErrorRate: Number(process.env.CANARY_MAX_ERROR_RATE ?? "0.05"),
    maxP95Ms: Number(process.env.CANARY_MAX_P95_MS ?? "100"),
  };
}

export function metricsSnapshot() {
  const baseline = cohortStats(cohorts.baseline);
  const canary = cohortStats(cohorts.canary);
  const slo = canarySlo();

  const reasons: string[] = [];
  if (canary.total > 0) {
    if (canary.errorRate > slo.maxErrorRate) {
      reasons.push(
        `canary error rate ${(canary.errorRate * 100).toFixed(1)}% > ${(slo.maxErrorRate * 100).toFixed(0)}% SLO`
      );
    }
    if (canary.latencyMs.p95 > slo.maxP95Ms) {
      reasons.push(`canary p95 ${canary.latencyMs.p95}ms > ${slo.maxP95Ms}ms SLO`);
    }
  }

  return {
    cohorts: { baseline, canary },
    canary: { slo, breach: reasons.length > 0, reasons },
    recent,
  };
}

export function resetMetrics(): void {
  cohorts.canary = freshAgg();
  cohorts.baseline = freshAgg();
  recent.length = 0;
}
