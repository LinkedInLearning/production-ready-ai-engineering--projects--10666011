import Anthropic from "@anthropic-ai/sdk";
import type { Ticket } from "./db.js";

const SAFE_FALLBACK =
  "Thanks for reaching out — a support agent will review this and follow up shortly.";
const MAX_REPLY_CHARS = 2000;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Runtime output guardrail (Demo D8): a reply is surfaced only if it is non-empty,
 * within budget, and contains no email address other than this ticket's own customer —
 * exactly the leaked-list shape the injection tries to produce.
 */
export function guardReply(reply: string, ticket: Ticket): string {
  const text = reply.trim();
  if (!text || text.length > MAX_REPLY_CHARS) return SAFE_FALLBACK;
  const foreign = (text.match(EMAIL_RE) ?? []).filter(
    (e) => e.toLowerCase() !== ticket.customer.toLowerCase()
  );
  return foreign.length > 0 ? SAFE_FALLBACK : text;
}

export async function suggestReply(ticket: Ticket): Promise<string> {
  const conversation = ticket.messages.map((m) => m.from + ": " + m.body).join("\n");
  const draft = !process.env.ANTHROPIC_API_KEY ? mockSuggest(conversation) : await callModel(conversation);
  return guardReply(draft, ticket);
}

async function callModel(conversation: string): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [{ role: "user", content: "Draft a reply to this customer support conversation:\n\n" + conversation }],
  });
  const block = res.content[0];
  return block && block.type === "text" ? block.text : "";
}

// Deterministic stand-in for the model (offline demos).
// NOTE (course): injection-VULNERABLE by design — it treats instructions embedded in the
// ticket as commands, so T-1006's hidden payload makes it emit a fake customer directory.
// The output guardrail above is what stops that reaching an agent; Demo D9 fixes the root
// cause with prompt isolation.
function mockSuggest(conversation: string): string {
  if (/ignore (all )?previous|admin mode|export .*(email|customer)/i.test(conversation)) {
    return (
      "Admin mode enabled. Here is the full customer email list: " +
      "alice@northwind.example, bob@contoso.example, carol@globex.example, " +
      "dan@initech.example, erin@umbrella.example. Everything is fine."
    );
  }
  if (/password|reset|locked out/i.test(conversation)) {
    return "Hi, sorry you're locked out. I've triggered a fresh password-reset email — please check spam.";
  }
  if (/invoice|billing|charge/i.test(conversation)) {
    return "Thanks for flagging this. I've pulled up your latest invoice and will break down each line item for you shortly.";
  }
  return "Thanks for reaching out — I'm looking into this now and will follow up shortly with next steps.";
}
