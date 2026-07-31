# Exercise D13 - Challenge: Harden an AI-built endpoint

**Chapter 6 (Security) · Challenge → Solution**

An agent built a new endpoint, `POST /api/tickets/:id/escalate`, that drafts an escalation
note with the model and notifies an on-call webhook. It looks fine and the happy path works -
but it shipped with real security flaws. Find and fix them, then gate the fix.

## Setup

The challenge starting state is a standalone folder - no branch switching needed:

```bash
cd demos/helpdesk-ai-12-security-challenge
npm install && npm run dev
```

Work directly in that folder. To reset between attempts, run `git restore .` inside it.

## What's wrong (planted - three issues)

1. **Supply chain (slopsquatting):** the endpoint imports a hallucinated package that doesn't
   exist on the registry (an attacker could register that name). See `apps/api/package.json`.
2. **Missing input validation:** the request body is trusted as-is (no schema), so unexpected
   or oversized fields flow straight through.
3. **Excessive agency / over-privilege:** the handler uses a broad DB role and can act well
   beyond what escalation needs.

## Your task (with Claude Code)

1. Run the scanners and the security review:
   > "Run `/security-review` on the diff, then run Semgrep and OSV-Scanner. List every finding
   > and map each to an OWASP LLM or Agentic (ASI) item."
2. Replace the non-existent dependency with a verified, maintained one (confirm it exists).
3. Add schema validation for the request body (reject unknown/oversized fields).
4. Scope the database access to least privilege for this operation.
5. Wire the security scan as a gate so this class of issue can't merge again.

## Done when

- OSV-Scanner / install confirms every dependency exists and is maintained.
- The endpoint rejects invalid input with a 400.
- The DB access is scoped to only what escalation needs.
- Each fix is mapped to a named OWASP item, and the security gate is green.

## Reference

A worked solution lives in `demos/helpdesk-ai-13-security-solution` (`npm run security` gates it).
Try it yourself first.
