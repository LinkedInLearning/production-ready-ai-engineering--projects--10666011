# 07 - Mutation testing for correctness

**tl;dr: coverage tells you what ran. Mutation testing tells you whether the tests would notice if the code were wrong.**

The starter tests in `demos/helpdesk-ai/packages/core` are intentionally weak. They execute the SLA logic and priority sorting, but they skip the boundaries where bugs tend to hide.

That is why coverage can mislead. A line can run during a test without the test asserting anything meaningful about it.

Mutation testing changes the question. It deliberately alters the implementation and asks whether the tests fail. If a mutant survives, the suite did not protect that behavior.

For the SLA code, useful mutants include:

- `>` changed to `>=`,
- boundary comparisons weakened,
- due-soon thresholds altered,
- sorting direction flipped.

The right response is not "raise coverage." It is to strengthen assertions around behavior:

- exact SLA boundary,
- before and after the boundary,
- due-soon windows by priority,
- priority ordering,
- ordering by remaining SLA inside the same priority.

Property-based tests are a good fit when examples alone feel too narrow. For triage sorting, generate many ticket lists and assert general behavior: urgent work should not sort below low-priority work, and tighter SLA windows should move earlier when priority is equal.

Mutation score should not become vanity. It is a pressure test. The value is in the surviving-mutant report because it tells you what the tests still do not know.

For agent-written code, this is especially useful. Agents are good at producing plausible tests. Mutation testing asks whether those tests actually bite.
