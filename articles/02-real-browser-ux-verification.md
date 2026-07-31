# 02 - Real browser UX verification

**tl;dr: code that compiles is not the same as a user flow that works. Drive the app in a browser and verify every state.**

The starting `helpdesk-ai` UI has enough code to look convincing. It fetches tickets, filters a queue, shows customer context, opens a compose dialog, and posts replies. A code review can easily stop there.

The product claim is different: a support agent can open a ticket, draft a reply, send it, and understand what happened.

That claim needs a browser.

Have Claude Code drive the app at http://localhost:5173. It should search or filter the queue, open a high-risk ticket, draft a reply, submit it, and report:

- visible user state,
- console errors and warnings,
- failed network requests,
- whether the UI tells the user what happened.

In the starting app, the failure is useful. The submit request can fail while the UI clears the box and shows no retry or error. That is worse than a visible failure because it creates false confidence.

The same pass should check loading, empty, and fetch-error states. Agents often build the state the prompt points at and leave the others implied. Users live in those implied states.

The fix is straightforward:

- show loading while tickets fetch,
- show an empty state when no tickets exist,
- show a fetch error if the list request fails,
- show an inline submit error with retry if sending fails.

Then make Claude re-drive the same flow. The browser is the verification surface. TypeScript can tell you the handler exists. The browser tells you whether a person can recover.

Claude Code drives the built-in browser directly, so the same run that verifies the flow can also capture it: a screenshot of the silently-cleared box (the red frame) next to the visible inline error and retry (the green frame). Save the pair under `evidence/ux-states/`. One caution - captures are timing-sensitive, so wait for the network to settle or reload before each shot, or the empty-vs-loaded race gives you a misleading frame.

Be honest about what this technique is for. An agent driving a browser is genuinely useful for *verifying, triaging, and gating* an experience - catching the broken states, capturing the evidence, keeping regressions out. It is much weaker as a way to *generate* a good experience in the first place, and it does not replace a deterministic Playwright suite for anything you need to run the same way every time. The value is on the review side of the line, not the generation side. That is exactly where this course puts it.

For this course, the useful phrase is: "show me, in the running app." It keeps the agent honest and keeps us from mistaking plausible code for working product.
