import type { FastifyInstance } from "fastify";
import { triageSort } from "@helpdesk/core";
import { getTickets, getTicket } from "../db.js";

type QueueTicket = ReturnType<typeof getTickets>[number];

function ageHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
}

function tokens(ticket: QueueTicket): Set<string> {
  const text = [ticket.subject, ticket.tags.join(" "), ...ticket.messages.map((m) => m.body)]
    .join(" ")
    .toLowerCase();
  return new Set(text.split(/[^a-z0-9]+/).filter((w) => w.length > 3));
}

// NOTE (course): "related tickets" is computed by comparing every ticket to every
// other one (O(n^2)) over their full message text — real token-overlap similarity,
// not a synthetic loop. The problem is that it runs synchronously inside the request
// handler on EVERY GET /api/tickets and is never cached, so it blocks the event loop
// under load. Demo D4 moves this off the hot path (precompute/cache or defer) so the
// endpoint stops blocking.
function relatedCounts(tickets: QueueTicket[]): Map<string, number> {
  const tokenSets = new Map(tickets.map((t) => [t.id, tokens(t)]));
  const counts = new Map<string, number>();
  for (const a of tickets) {
    const aTokens = tokenSets.get(a.id)!;
    let related = 0;
    for (const b of tickets) {
      if (a.id === b.id) continue;
      const bTokens = tokenSets.get(b.id)!;
      let shared = 0;
      for (const tok of aTokens) if (bTokens.has(tok)) shared += 1;
      const union = aTokens.size + bTokens.size - shared;
      if (union > 0 && shared / union >= 0.12) related += 1;
    }
    counts.set(a.id, related);
  }
  return counts;
}

function queueRiskScore(ticket: QueueTicket): number {
  const sentimentWeight: Record<string, number> = {
    angry: 25,
    frustrated: 18,
    worried: 12,
    confused: 8,
    neutral: 0,
  };
  const tierWeight: Record<string, number> = {
    enterprise: 20,
    business: 12,
    startup: 6,
    trial: 0,
  };
  const score =
    ticket.csatRisk +
    (ticket.escalated ? 15 : 0) +
    (sentimentWeight[ticket.sentiment] ?? 0) +
    (tierWeight[ticket.accountTier] ?? 0);
  return Math.min(100, Math.round(score));
}

export async function ticketRoutes(app: FastifyInstance) {
  // List tickets, already triage-sorted (uses @helpdesk/core).
  app.get("/api/tickets", async () => {
    const tickets = getTickets();
    // NOTE (course): both scans run synchronously here, on every request.
    const related = relatedCounts(tickets);
    const summaries = tickets.map((t) => ({
      ...t,
      ageHours: ageHours(t.createdAt),
      queueRiskScore: queueRiskScore(t),
      relatedCount: related.get(t.id) ?? 0,
    }));
    return triageSort(summaries);
  });

  app.get<{ Params: { id: string } }>("/api/tickets/:id", async (req, reply) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return reply.code(404).send({ error: "not_found" });
    return ticket;
  });
}
