# 01 - Quality bar as a fitness function

**tl;dr: a quality bar is only useful if the repo can enforce it. Start by turning one rule into one command that fails.**

Most teams already have standards. The problem is that many standards live in docs, pull request comments, or someone senior's memory. Those are helpful, but they are not load-bearing when agents can produce plausible changes quickly.

The `helpdesk-ai` app has a simple architecture rule: `apps/web` must not import code from `apps/api`. The web app should use the HTTP API. Shared code belongs in `packages/core`.

In the starting state, that rule is already violated. `apps/web/src/api.ts` imports `suggestFlag` from `apps/api/src/flags.ts` - the server's AI feature-flag module - to decide whether to show the Suggested Reply button on the client.

It looks harmless. It even type-checks and runs (a `typeof process` guard papers over the browser error). But it is the exact shortcut the rule exists to stop: the web app has reached across the boundary and pulled server-only code - code that reads `process.env` - toward the client. And the rule's real value is the class it blocks, not this one import. The same reach would pull in `apps/api/src/db.ts`, which imports `node:fs` and will not build for the browser, or the LLM module that reads your `ANTHROPIC_API_KEY`. A fitness function does not adjudicate which server import is "safe enough" - it fails the moment the layer is crossed.

The fix is to make the rule executable.

Ask Claude Code to add a dependency check and wire it to `npm run fitness`. The first run should go red. That red state matters because it proves the rule is catching real behavior, not just performing ceremony.

Then fix the boundary. The client never needed to evaluate the flag - the server already gates the feature and falls back to a template when it is off. So remove the cross-boundary import and let the web app call the API. (When a genuinely shared, framework-free helper is involved, its home is `@helpdesk/core`, not `apps/api`.) Then run:

```bash
npm run fitness
npm run test
```

The pattern is small, but it scales. Once a standard has a command, it can run locally, in CI, and in every agent session. A human no longer has to remember the rule in every review.

This is the durable idea behind the "spec-driven development" tooling that showed up across 2026 (Spec Kit, Kiro, EARS-style acceptance criteria): the specification becomes executable checks rather than prose. A fitness function is the smallest version of that idea - one rule, one command that fails.

You can also make the agent enforce the bar on itself instead of relying on it to run the check unprompted. A completion goal (`/goal npm run fitness and npm run test both pass`) makes Claude re-evaluate the condition after each turn and keep working until the gate is actually green, or stop and say it cannot. Underneath, that is a Stop hook - and a hand-written Stop hook is the deterministic fallback if the `/goal` command is not in your installed version. Either way, the check defines "done," not the model's confidence. (Verify the exact command against your current Claude Code build before depending on it.)

This is the operating model for the rest of the course:

- Name the bar.
- Turn it into a check.
- Let it fail on the current app.
- Fix the real cause.
- Keep the check.

The important habit is to resist the urge to silence the check. The check is there to expose drift. Listen to it first.
