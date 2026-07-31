# 13 - CI quality gates

**tl;dr: checks that live only on a laptop are advisory. Required CI checks are enforced.**

By the time the course reaches CI, the app has several local gates:

- architecture fitness,
- typecheck,
- unit tests,
- browser or UX checks,
- accessibility checks,
- performance budget,
- evals,
- security scan,
- reliability tests.

Do not put imaginary jobs in CI. Have Claude inspect `package.json` and wire the commands that actually exist. Missing checks can stay as comments or follow-up issues, but the workflow should run today.

A practical GitHub Actions workflow should:

- install with the right package manager,
- cache dependencies,
- run deterministic checks first,
- fail fast on command failures,
- upload artifacts only where useful,
- avoid secrets unless a job truly needs them.

Then add the policy layer. Some standards are repo-specific: every new route needs validation, or every LLM route needs an eval. Those can be custom scripts or bounded Claude/Agent SDK review steps — including a fresh-context reviewer subagent that reads the diff and reports findings as a required check. The output needs to be parseable enough to fail CI with file-line findings.

CI is not the only enforcement point, and it should not be the first. A check that only runs in CI still lets a red change leave the laptop. Move the fast gates one step earlier with a local hook: a Stop hook (which blocks the agent from declaring work done while a check is red) or a pre-commit hook (which blocks the commit). The hook and CI are defense in depth — the hook prevents most red changes from being pushed, and CI is the backstop for whatever escapes. (Hook event names and the settings schema have changed across Claude Code versions; confirm the current form before relying on it.)

The important demo beat is a bad change. Add a route without validation or weaken a test. The workflow goes red. Required checks block the merge. Then fix the issue and watch the board go green.

CI changes the culture because it moves a repeated review argument into the system. The human still owns judgment. The machine owns remembering.
