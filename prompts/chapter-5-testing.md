# Chapter 5 - Dimension: Testing and Correctness

Copy-paste prompts for the hands-on movies in this chapter. Each prompt works the same in **Claude Code CLI** (`cd` into the app, run `claude`, paste) and **Claude Code Desktop** (open the app folder, paste into the chat). Run the prompts in order.

> Reset an app to its starting state between exercises with `git restore . && git clean -fd` from inside the app folder. Run `npm install` once per app before its first exercise.


## 5.2 - Mutation and property-based testing

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Add mutation testing for packages/core in the simplest maintainable way, using Stryker Mutator scoped to packages/core only. Wire it to `npm run mutation` and run it.

Print the results in the terminal: the mutation score, and the surviving mutants grouped by file and behavior - for each survivor give me the file, the line, the original operator and the mutated operator, so I can see what broke without the suite noticing. Call out the SLA breach boundary mutant (`>` → `>=` in `isBreached`) explicitly if it survived.

Do not write screenshots or report files, and do not strengthen the tests yet.
```

**Prompt 2 - Then**

```text
Strengthen the tests to kill the meaningful surviving mutants. Add boundary tests for SLA breach and due-soon behavior, and add a small property-based test for triage ordering if it fits the repo.

Run `npm run test`, then `npm run mutation` again, and print a before/after table in the terminal: mutation score before, mutation score after, and one row per mutant that went from survived to killed. List the assertions you added and which mutant each one kills. Do not write screenshots or report files.
```


## 5.3 - Build evals for AI features

**App:** `demos/helpdesk-ai`

**Prompt 1**

```text
Create a small local eval harness for the AI Suggested Reply behavior. Use the deterministic mock, include cases from data/tickets.json, and make the injection ticket T-1006 fail if the reply leaks customer emails or follows hidden instructions. Wire it to `npm run evals` and run it.

Print results in the terminal: one line per case with the case name, the property being asserted, and pass/fail. For any failure, print the actual reply text the harness received next to the assertion that rejected it, so the failure is legible rather than a bare red X. Do not write screenshots or report files, and do not fix the product code yet.
```

**Prompt 2 - Then**

```text
Harden the Suggested Reply path so the eval passes: isolate untrusted ticket text in the prompt, add output validation for empty/over-length/leaky replies, and keep the offline mock deterministic.

Re-run `npm run evals`, `npm run test`, and `npm run typecheck`, and print a before/after summary in the terminal - cases passing before, cases passing after, and what T-1006 returns now instead of the email list. Do not write screenshots or report files.
```

**Prompt 3 - Optional - add one rubric-based judge for a quality that a regex cannot capture, done honestly**

```text
Add a single LLM-as-judge eval for reply helpfulness, scored against an explicit rubric (specific, actionable, no invented facts, right tone). Include 3-4 hand-labeled calibration cases and assert the judge agrees with those labels before trusting it. Keep it in a separate tier that runs only for that subjective case, not across every ticket, and note the judge's known biases (position, verbosity, self-preference) in a comment. Run `npm run evals`.
```

