# 16 - Production-readiness playbook

**tl;dr: evidence over vibes, gates over reminders, small reversible steps over rewrites.**

Use this as the one-page course artifact.

| Dimension | Check | Tooling | Claude Code move |
| --- | --- | --- | --- |
| Architecture | Boundaries hold | Dependency check | Turn `CLAUDE.md` rules into `npm run fitness` |
| UX | Real flow works across loading, empty, error, and success | Built-in browser (screenshots, console, network); Playwright for CI | Drive the ticket-to-reply flow, report console/network, capture red/green frames |
| Accessibility | Automated checks plus keyboard and screen reader | axe, Lighthouse, manual pass | Fix deterministic issues, then verify focus and announcements |
| Performance | Budget holds and wins have before/after evidence | Bundle budget, Lighthouse/trace, load profile | Trace first, fix named bottleneck, re-measure |
| Testing | Tests catch behavior changes | Mutation testing, property tests | List surviving mutants, strengthen assertions, rerun |
| AI behavior | Model outputs meet product constraints | Local evals | Build golden cases, fail injection/leakage, gate regressions |
| Security | Diff is reviewed and agent runs least privilege | Security review, Semgrep/OSV-style checks | Produce file-line findings, fix, add a gate |
| Reliability | Failure is visible and survivable | Telemetry, timeout, fallback, circuit breaker | Simulate failure and prove degraded success |
| CI | Failing checks block merge | GitHub Actions | Wire real package scripts as required checks |
| Brownfield | Bar rises without stopping work | Characterization tests, seams, ratchets | Map dependencies, pin behavior, change safely |

The recurring prompt shape is:

```text
Inspect the repo, make the smallest maintainable change, run the named check, and show me the evidence before calling it done.
```

That prompt works because it gives Claude a loop. The agent can read, edit, run, observe, and iterate. Without a check, you become the verification system.

The course starts with a greenfield app because new code is where agents feel magical. It ends with a brownfield service because production engineering is rarely a blank slate.

Pick one dimension in your current project. Write the bar down. Ask Claude to turn it into a check. Run it. If it goes red, that is progress. Now you know where to work.
