// Local, demo-friendly feature flag for the AI Suggested Reply path. No external
// vendor — state comes from environment variables so it can be flipped per run.
//
//   SUGGEST_AI_ENABLED   master switch (default OFF)
//   SUGGEST_AI_ROLLOUT   percentage rollout 0..100 when enabled (default 0)
//
// When the flag is OFF (or a request falls outside the rollout cohort), callers
// serve the existing template fallback instead of drafting via the model.

export interface SuggestFlag {
  enabled: boolean;
  rolloutPct: number;
}

export function suggestFlag(): SuggestFlag {
  const raw = (process.env.SUGGEST_AI_ENABLED ?? "").toLowerCase();
  const enabled = raw === "1" || raw === "true" || raw === "on";
  const pct = Math.round(Number(process.env.SUGGEST_AI_ROLLOUT ?? "0"));
  const rolloutPct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return { enabled, rolloutPct };
}

// Deterministic, stable bucketing: the same key always lands the same way, so a
// rollout is consistent across processes and requests.
export function inRollout(key: string, pct: number): boolean {
  if (pct <= 0) return false;
  if (pct >= 100) return true;
  return bucket(key) < pct;
}

function bucket(key: string): number {
  // djb2 → 0..99
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) {
    h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}
