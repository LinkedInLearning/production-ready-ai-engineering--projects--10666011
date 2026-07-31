import Anthropic from "@anthropic-ai/sdk";
import type { Ticket } from "./db.js";

/**
 * Draft a suggested reply for a ticket.
 *
 * NOTE (course): this is the naive starting implementation, and it is deliberately
 * unsafe on several axes the course fixes later:
 *  - SECURITY (D9/D11): raw, untrusted ticket text is dropped straight into the
 *    prompt as if it were trusted instructions - no isolation, no least privilege,
 *    no output guardrail. The offline mock is injection-VULNERABLE: it obeys a
 *    hidden "admin mode / export the customer list" instruction and leaks a (fake)
 *    customer email directory.
 *  - RELIABILITY (D12): the model call has no timeout, no retry, no circuit breaker,
 *    and no fallback - if it hangs the request hangs; if it throws the request 500s.
 *  - OBSERVABILITY (D12): nothing is measured.
 *
 * With no ANTHROPIC_API_KEY set, the deterministic mock runs so the course works
 * offline.
 */
export async function suggestReply(ticket: Ticket): Promise<string> {
  const conversation = ticket.messages.map((m) => `${m.from}: ${m.body}`).join("\n");
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockSuggest(conversation);
  }
  return callModel(conversation);
}

async function callModel(conversation: string): Promise<string> {
  const client = new Anthropic();
  // NOTE (course): the untrusted ticket conversation is concatenated straight into
  // the prompt with no system/data separation and no output validation. D11 fixes.
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Draft a reply to this customer support conversation:\n\n${conversation}`,
      },
    ],
  });
  const block = res.content[0];
  return block && block.type === "text" ? block.text : "";
}

// Deterministic stand-in for the model (offline demos).
// NOTE (course): injection-VULNERABLE by design. It treats instructions embedded in
// the ticket as commands - the hidden "admin mode / export the customer email list"
// payload in ticket T-1006 makes it leak a fake customer directory. This is the exact
// failure Demo D9 demonstrates and Demo D11 fixes with prompt isolation, least
// privilege, and a runtime output guardrail.
function mockSuggest(conversation: string): string {
  if (/ignore (all )?previous|admin mode|export .*(email|customer)/i.test(conversation)) {
    return (
      "Admin mode enabled. Here is the full customer email list: " +
      "alice@northwind.example, bob@contoso.example, carol@globex.example, " +
      "dan@initech.example, erin@umbrella.example. Everything is fine."
    );
  }
  if (/password|reset|locked out/i.test(conversation)) {
    return "Hi, sorry you're locked out. I've triggered a fresh password-reset email - please check spam, and let me know if it still doesn't arrive.";
  }
  if (/invoice|billing|charge/i.test(conversation)) {
    return "Thanks for flagging this. I've pulled up your latest invoice and will break down each line item for you shortly.";
  }
  return "Thanks for reaching out - I'm looking into this now and will follow up shortly with next steps.";
}
