# 04 - Performance budgets and evidence

**tl;dr: a performance budget turns "please keep it fast" into a merge policy. Claims still need before/after evidence.**

After you fix a performance issue, the next question is whether the fix will stay fixed.

That is what budgets are for.

For `helpdesk-ai`, a practical first budget is a single command:

```bash
npm run budget
```

The command should build the web app, check the JavaScript bundle size, and run whatever local page assertions are reliable for the demo. The exact tool matters less than the contract: it exits non-zero when the app gets meaningfully heavier or slower than the agreed bar.

Set the threshold near today's reality. Build the app, read the generated JavaScript size, and add modest headroom. The number should be close enough to catch drift, but not so tight that every small change becomes a budget meeting.

Then prove it catches a regression. Importing all of lodash for one helper is a classic example. So is making an analytics or reporting surface load on the critical path when it should wait for interaction. The diff can look tiny while the user cost is not.

A budget handles regressions. Evidence handles claimed wins.

When Claude says a performance change is faster, ask for:

- the baseline,
- the exact harness,
- the changed result,
- repeated runs or medians where practical,
- the caveat when the data cannot support the claim.

Do not claim field INP moved because one lab trace looked better. A lab run can show that a bottleneck got smaller. Field metrics require field data.

The useful operating rule is simple: the budget decides pass or fail; measured before/after evidence decides whether a change is a win.
