import type { FastifyInstance } from "fastify";
import { createHmac } from "node:crypto";
import { isSafeWebhookUrl } from "@helpdesk/core";
import { getTicket, type Ticket } from "../db.js";
import { suggestReply } from "../llm.js";

/**
 * POST /api/tickets/:id/escalate
 * Drafts an escalation note for a ticket and posts it to a *server-configured*
 * webhook. Hardened:
 *  - FIX 1: no third-party signer dependency - HMAC signing uses node:crypto.
 *  - FIX 2: strict body schema (bounds + closed value sets + unknown-field reject).
 *  - FIX 3: the webhook destination is server-controlled and SSRF-validated; it is
 *    never taken from the request.
 *  - FIX 4: the note carries only this ticket's own fields (least privilege) - no
 *    customer directory.
 */

// FIX 2 - strict request validation. additionalProperties:false rejects unknown
// fields (e.g. a smuggled `webhookUrl`) with a 400; bounds cap length; priority is
// a closed enum.
const escalateBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["reason"],
  properties: {
    reason: { type: "string", minLength: 1, maxLength: 500 },
    priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
  },
} as const;

interface EscalateBody {
  reason: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface EscalationNote {
  ticket: string;
  subject: string;
  priority: string;
  reason: string;
  summary: string;
}

// FIX 4 - least privilege: only the escalated ticket's own fields. No getTickets(),
// no customer directory, no other customers' PII.
export function buildEscalationNote(
  ticket: Ticket,
  body: EscalateBody,
  summary: string
): EscalationNote {
  return {
    ticket: ticket.id,
    subject: ticket.subject,
    priority: body.priority ?? ticket.priority,
    reason: body.reason,
    summary,
  };
}

// FIX 3 - the destination is read from server config and re-validated as a safe
// public HTTPS URL. Returns null when unset or unsafe, so nothing is posted.
export function escalationWebhookUrl(): string | null {
  const raw = process.env.ESCALATION_WEBHOOK_URL;
  if (!raw || !isSafeWebhookUrl(raw)) return null;
  return raw;
}

async function postEscalation(url: string, note: EscalationNote): Promise<void> {
  const payload = JSON.stringify(note);
  const secret = process.env.ESCALATION_WEBHOOK_SECRET ?? "";
  // FIX 1 - sign with the platform crypto library, not an unvetted package.
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": signature },
    body: payload,
    signal: AbortSignal.timeout(5000),
  });
}

export async function escalateRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string }; Body: EscalateBody }>(
    "/api/tickets/:id/escalate",
    { schema: { body: escalateBodySchema } },
    async (req, reply) => {
      const ticket = getTicket(req.params.id);
      if (!ticket) return reply.code(404).send({ error: "not_found" });

      const summary = await suggestReply(ticket);
      const note = buildEscalationNote(ticket, req.body, summary);

      const url = escalationWebhookUrl();
      let dispatched = false;
      if (url) {
        try {
          await postEscalation(url, note);
          dispatched = true;
        } catch (err) {
          req.log.error({ err }, "escalation webhook post failed");
        }
      }

      return { escalated: true, dispatched, ticket: ticket.id };
    }
  );
}
