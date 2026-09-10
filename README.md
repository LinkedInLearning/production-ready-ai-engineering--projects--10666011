# Production-Ready AI Engineering
This is the repository for the LinkedIn Learning course `Production-Ready AI Engineering`. The full course is available from [LinkedIn Learning][lil-course-url].

![lil-thumbnail-url]

## Course Description

Your AI agent can build a feature in minutes. The demo works. But would you ship it to real
users, on a real network, with real data - and sleep well? That gap is this course.

You work in two apps: a greenfield AI helpdesk of the kind an agent assembles in minutes,
carrying the quality problems that speed creates, and an older orders service you inherited -
plain JavaScript, no tests, too much shared state, still making money, and nobody wants a
rewrite. One you are proud to build; one you have to make safer without stopping the line.

For every dimension of quality - user experience, accessibility, performance, testing, AI
evals, security, reliability, CI, and rollout - the move is the same: name the bar, have Claude
Code turn it into an executable check, let it fail, fix the real problem, run the check again.
Where there is a UI, the evidence is not just a green check in the terminal: Claude drives the
browser, so you catch the app being wrong, then catch it being right. Evidence over vibes.

This course assumes you already know the basics of working with a coding agent.

## Instructions

Exercise files are organized as **folders**, not per-video branches. Everything ships on the
main branch, so you can clone once and work through the whole course.

| Path | What it holds |
| --- | --- |
| `demos/helpdesk-ai` | Greenfield app - **the app you build in** for most of the course |
| `demos/orders-legacy` | Brownfield app - the app you build in for the legacy chapter |
| `demos/<chapter>.<movie>-<slug>` | Finished state of each hands-on movie (answer keys) |
| `prompts/` | **Copy-paste Claude Code prompts, one README per chapter** |
| `articles/` | Reference article per episode |

`demos/helpdesk-ai` is **deliberately imperfect**. It ships the planted defects each episode
fixes, and it ships **no quality gates** - every episode adds its own. That is the point: you
watch a check go red, then green. See [demos/README.md](demos/README.md) for the full map of
apps and answer keys.

### Working through an episode

1. `cd demos/helpdesk-ai` (or `demos/orders-legacy` for the legacy chapter) and `npm install`.
2. Open the matching chapter in [`prompts/`](prompts) - it lists each movie with its prompts.
3. Run `claude` (CLI) or open the folder in Claude Code Desktop, paste the prompt, and let the
   agent make the changes.
4. Review the diff and run the verification the prompt names.
5. Compare against the answer key in `demos/<chapter>.<movie>-<slug>` if you want.

### Resetting between episodes

From inside the app folder:

```bash
git restore . && git clean -fd
```

Both halves matter. `git restore` reverts tracked files; `git clean` removes the config and
gate files the previous episode *created*, which a restore leaves behind. Ignored files
(`node_modules/`, `evidence/`) survive. `git status --short` should print nothing.

## Installing

1. To use these exercise files, you must have the following installed:
	- [Node.js](https://nodejs.org) 20 or later, and npm
	- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (terminal, desktop, or IDE)
	- git
2. Clone this repository into your local machine using the terminal (Mac), CMD (Windows), or a GUI tool like SourceTree.
3. Install and start the greenfield app:

	```bash
	cd demos/helpdesk-ai
	npm install
	npm run seed
	npm run dev
	```

	The web app runs on http://localhost:5173 and the API on http://localhost:3001.

**No API key is required.** Without `ANTHROPIC_API_KEY`, the app's AI feature uses a
deterministic mock - which is exactly what the prompt-injection and evals episodes rely on.

## Instructor

Addy Osmani

Addy Osmani is an engineering and evangelism leader who spent over 14 years at Google leading
developer experience. In recent years his focus shifted to AI: Gemini's developer experience,
agentic engineering, coding agents, harnesses, evals and benchmarks, and code quality - work
that led into a Director role at Google Cloud AI running Cloud AI Developer Experience and
Technical Evangelism, where he helped launch Google's agent developer platform (Agent Platform,
Agent CLI, and Agent Studio). Earlier he led Chrome's Developer Experience, working on DevTools,
Lighthouse, and Core Web Vitals.

Check out my other courses on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/addy-osmani).


[0]: # (Replace these placeholder URLs with actual course URLs)

[lil-course-url]: https://www.linkedin.com/learning/production-ready-ai-engineering
[lil-thumbnail-url]: https://media.licdn.com/dms/image/v2/D560DAQGwwakfncY_2g/learning-public-crop_675_1200/B56Z9s262lH4Ag-/0/1784237764741?e=2147483647&v=beta&t=UGQfCu0mbFZf2GorNMELDG67m4Gi716qd38ByGwhAO0
