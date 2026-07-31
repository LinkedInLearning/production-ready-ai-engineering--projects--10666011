# 03 - Performance tracing before fixing

**tl;dr: performance work starts with evidence. Let the trace name the bottleneck before changing code.**

The `helpdesk-ai` ticket list starts with an intentionally oversized, dimensionless hero image. It also has a reporting panel that runs queue analytics eagerly and an API route that computes queue-risk scores on every request. That gives us a useful teaching shape: image cost, render cost, bundle cost, and server cost can all look like "the app is slow" until a trace separates them.

The wrong move is to guess. A slow page can tempt you into memoization, lazy loading, dependency swaps, or caching before you know what is actually slow. Sometimes that works. Often it just creates a more complicated slow page.

Start with a browser trace — in plan mode.

Run the measurement pass in plan mode (read-only) so the agent can trace and profile without editing. Separating exploration from implementation is the point: it keeps diagnosis honest and stops the agent from "fixing" before it has evidence. Switch out of plan mode only once the trace has named the bottleneck.

Ask Claude Code to load http://localhost:5173 and inspect the Largest Contentful Paint element. The useful output is not "the app feels slow." It is:

- the LCP element,
- why it is expensive,
- whether it contributes to layout shift,
- the source file to inspect,
- the before number.

In this app, the first trace should point at the hero image. The image is the largest element in the viewport. The markup does not reserve its dimensions, so the browser cannot lay out the page stably before the image arrives.

The fix is deliberately boring:

- explicit `width` and `height`,
- responsive image sizing,
- sensible `sizes`,
- priority for the LCP image where appropriate.

Then record the trace again using the same method. A performance fix is only a fix once the same harness shows movement.

After that, keep looking. If the page still has long tasks, inspect the eager reporting work before reaching for random memoization. If the API p95 is poor, put `GET /api/tickets` under load, profile it, identify synchronous work on the event loop, change the hot path, then re-run the same load. Do not mix harnesses and call the difference a result.

Performance engineering is mostly epistemology in work boots: what do we know, how do we know it, and did the change move the number that matters?
