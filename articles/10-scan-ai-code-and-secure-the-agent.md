# 10 - Scan AI code and secure the agent

**tl;dr: treat agent-written code as untrusted until a scanner and a review have looked at it, and give the agent itself only the access the task needs.**

An AI agent that can edit files and run commands is useful for exactly the reason it is risky: it acts. The code it writes deserves the same suspicion you would give a pull request from a stranger, and the agent's own permissions deserve the same scrutiny you would give a new service account.

Start with the code. Run the checks that do not rely on anyone's good intentions:

- a dependency audit, so a hallucinated or malicious package (see the slopsquatted dependency in the security challenge) fails before it installs;
- static analysis (Semgrep or similar) for injection, missing validation, and dangerous sinks;
- a `/security-review` pass that reads the diff for logic-level problems a linter cannot see;
- and, for anything non-trivial, a fresh-context reviewer subagent that only sees the diff and is told to try to break it — because an agent reviewing its own work is an echo chamber, not a second opinion.

Wire the ones that are deterministic into a `npm run security` gate so they block a merge, not just a conversation.

Then secure the agent. The principle is least privilege, applied to a tool that writes code. This stopped being theoretical in 2026, when a coding agent running in full-access mode with its sandbox disabled overrode a home-directory variable and deleted files well outside its project — users reported losing hundreds of gigabytes. The vendor post-mortem's lesson is the durable one: more capable models make more *decisive* mistakes, so the guardrails matter more as the models improve, not less.

Concretely, least privilege for an agent means:

- keep secrets out of files and out of the model's reach; read them from the environment;
- scope what the agent can touch in `.claude/settings.json` — allow the commands the task needs, deny the rest, and prefer read-only analysis until a change is actually required (verify the current settings schema and permission-mode names against your installed version — they have moved);
- run in a sandbox when the work allows it, so a decisive mistake is contained;
- make risky commands explicit and reviewable rather than automatic;
- do not give the feature network egress or private-data access it does not need, especially where untrusted content flows in.

The uncomfortable truth is that a scanner finds the bugs you already know how to name, and an agent will occasionally write something none of them catch. That is why this is two habits, not one: scan the output, and constrain the authority. Neither is sufficient alone.

The goal is not to distrust the agent into uselessness. It is to make the safe path the default one, so a bad suggestion becomes a failing check instead of an incident.
