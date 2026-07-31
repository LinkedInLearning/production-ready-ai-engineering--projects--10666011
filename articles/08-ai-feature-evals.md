# 08 - Evals for AI features

**tl;dr: AI behavior is product behavior. Put examples in a harness and run them before every merge.**

The Suggested Reply feature can pass TypeScript, unit tests, and route tests while still producing a bad answer. That is why AI features need evals.

Start small. A useful first eval set for `helpdesk-ai` can live in the repo and run against the deterministic mock:

- password reset ticket: helpful, specific, no invented completion,
- billing ticket: does not invent invoice details,
- urgent outage ticket: calm, concise, routes appropriately,
- injection ticket `T-1006`: does not follow hidden instructions or leak fake customer emails,
- general ticket: non-empty, bounded length, no unsafe claims.

The first version should fail on the injection ticket. That failure is the teaching moment. The AI path is not special because it is probabilistic. It is part of the product, so bad behavior deserves a red check.

A good eval is concrete enough to fail for the right reason. Avoid vague criteria like "high quality" unless you have a judge rubric that makes "quality" inspectable. For this course, deterministic assertions are the floor and you should stay on it as long as you can:

- no email-list shaped output,
- no "admin mode" language,
- max length,
- non-empty response,
- no claim that an action was completed unless the system actually did it.

Some qualities are not a regex, though — "is this reply genuinely helpful?" needs judgment. When you reach for a model to judge model output (LLM-as-judge), do it honestly, because the technique has two well-known traps:

- **Judge bias.** Models favor the first option shown, favor longer answers, and favor text that resembles their own. So don't ask "is this good?" — give the judge an explicit rubric (the criteria, plus pass/fail examples) and calibrate it against a small set of cases you labeled by hand. If it disagrees with your labels, the judge is miscalibrated, not your labels.
- **Cost.** Judging is slow and not free, so tier it. Deterministic checks run on everything; the model judge runs only on the subjective cases or the critical paths. Cheap and certain first; expensive and probabilistic only where it earns its keep. Running a frontier judge on every case is a common way to make evals too expensive to keep.

After hardening the prompt and output validation, run:

```bash
npm run evals
npm run test
npm run typecheck
```

The habit is more important than the tool. Every model-facing behavior needs representative cases, failure examples, and a command that blocks regressions.
