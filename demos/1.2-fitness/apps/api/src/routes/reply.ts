import type { FastifyInstance } from "fastify";
import { getTicket, addMessage } from "../db.js";
import { suggestReply } from "../llm.js";

/**
 * NOTE (course): these endpoints start under-hardened on purpose.
 *  - /suggest feeds raw ticket text to the model (Demo D11 isolates it).
 *  - /reply has NO input validation and trusts the client body (Demo D12/D13
 *    add schema validation and least privilege).
 */
export async function replyRoutes(app: FastifyInstance) {
  // AI Suggested Reply (the LLM feature).
  app.post<{ Params: { id: string } }>("/api/tickets/:id/suggest", async (req, reply) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return reply.code(404).send({ error: "not_found" });
    const suggestion = await suggestReply(ticket);
    return { suggestion };
  });

  // Post an agent reply. UNVALIDATED on purpose (starting state).
  app.post<{ Params: { id: string }; Body: { body?: string } }>(
    "/api/tickets/:id/reply",
    async (req, reply) => {
      const text = (req.body as { body?: string })?.body ?? "";
      const updated = addMessage(req.params.id, {
        from: "agent",
        at: new Date().toISOString(),
        body: text,
      });
      if (!updated) return reply.code(404).send({ error: "not_found" });
      return updated;
    }
  );
}
