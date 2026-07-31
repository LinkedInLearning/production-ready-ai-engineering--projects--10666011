export * from "./priority.js";
export * from "./sla.js";
export * from "./ticket-id.js";
export * from "./webhook-url.js";

import { Priority, priorityWeight } from "./priority.js";

export interface TicketSummary {
  id: string;
  priority: Priority;
  ageHours: number;
  slaHours: number;
}

/**
 * Sort tickets so the most pressing work is first: higher priority first,
 * then less SLA time remaining.
 */
export function triageSort<T extends TicketSummary>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => {
    const byPriority = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (byPriority !== 0) return byPriority;
    const aRemaining = a.slaHours - a.ageHours;
    const bRemaining = b.slaHours - b.ageHours;
    return aRemaining - bRemaining;
  });
}
