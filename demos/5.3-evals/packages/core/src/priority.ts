export type Priority = "low" | "normal" | "high" | "urgent";

/** Priorities from least to most important. */
export const PRIORITY_ORDER: Priority[] = ["low", "normal", "high", "urgent"];

/** Numeric weight for sorting: low=0 .. urgent=3. */
export function priorityWeight(p: Priority): number {
  return PRIORITY_ORDER.indexOf(p);
}

/**
 * How many hours before an SLA breach we consider a ticket "due soon",
 * scaled by priority. Tighter window for higher priority.
 */
export function urgencyWindow(p: Priority): number {
  switch (p) {
    case "urgent":
      return 1;
    case "high":
      return 4;
    case "normal":
      return 12;
    case "low":
      return 24;
  }
}
