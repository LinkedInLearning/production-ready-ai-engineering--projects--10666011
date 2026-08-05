import { Priority, urgencyWindow } from "./priority.js";

export type SlaState = "ok" | "due-soon" | "overdue";

/** Hours remaining before the SLA is breached (negative if already past). */
export function slaRemainingHours(slaHours: number, ageHours: number): number {
  return slaHours - ageHours;
}

/**
 * Whether the ticket has breached its SLA.
 * NOTE (course): the boundary here is intentionally subtle. Demo D9 uses
 * mutation testing to reveal that the weak starter test never checks the
 * exact-boundary case, so a `>` vs `>=` mutant survives.
 */
export function isBreached(slaHours: number, ageHours: number): boolean {
  return ageHours > slaHours;
}

/** Classify a ticket's SLA state given its priority and age. */
export function slaState(priority: Priority, slaHours: number, ageHours: number): SlaState {
  const remaining = slaRemainingHours(slaHours, ageHours);
  if (remaining <= 0) return "overdue";
  if (remaining <= urgencyWindow(priority)) return "due-soon";
  return "ok";
}
